import { Role } from "../../../generated/prisma/enums.js";
import AppError from "../../errors/AppErrors.js";
import { prisma } from "../../lib/prisma.js";
import type {
	CreateProgramInput,
	GetProgramsQuery,
	UpdateProgramInput,
} from "./program.interface.js";

const ensureDepartmentManager = async (
	userId: string,
	departmentId: string,
) => {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: { teacher: true },
	});

	if (!user) throw new AppError(404, "User not found.");

	const isSuperAdmin = user.role === Role.SUPER_ADMIN;
	const isDepartmentAdmin =
		user.role === Role.TEACHER &&
		user.teacher?.isDeptAdmin === true &&
		user.teacher.departmentId === departmentId;

	if (!isSuperAdmin && !isDepartmentAdmin) {
		throw new AppError(
			403,
			"Only the department admin or super admin can manage this program.",
		);
	}
};

const ensureDepartmentExists = async (departmentId: string) => {
	const department = await prisma.department.findUnique({
		where: { id: departmentId },
	});

	if (!department) throw new AppError(404, "Department not found.");
};

const getProgram = async (id: string) => {
	const program = await prisma.program.findUnique({
		where: { id },
		include: {
			department: true,
			_count: {
				select: {
					students: true,
					curriculumCourses: true,
					admissions: true,
				},
			},
		},
	});

	if (!program) throw new AppError(404, "Program not found.");
	return program;
};

export const createProgram = async (
	userId: string,
	payload: CreateProgramInput,
) => {
	await ensureDepartmentExists(payload.departmentId);
	await ensureDepartmentManager(userId, payload.departmentId);

	const existing = await prisma.program.findUnique({
		where: {
			departmentId_degreeType: {
				departmentId: payload.departmentId,
				degreeType: payload.degreeType,
			},
		},
	});

	if (existing) {
		throw new AppError(
			409,
			"A program with this degree type already exists in the department.",
		);
	}

	return prisma.program.create({
		data: payload,
		include: { department: true },
	});
};

export const getPrograms = async ({ departmentId }: GetProgramsQuery) => {
	return prisma.program.findMany({
		where: departmentId ? { departmentId } : undefined,
		include: { department: true },
		orderBy: [
			{ department: { name: "asc" } },
			{ degreeType: "asc" },
		],
	});
};

export const getProgramById = async (id: string) => getProgram(id);

export const updateProgram = async (
	userId: string,
	id: string,
	payload: UpdateProgramInput,
) => {
	const existing = await getProgram(id);
	await ensureDepartmentManager(userId, existing.departmentId);

	if (
		payload.degreeType !== undefined &&
		payload.degreeType !== existing.degreeType
	) {
		const duplicate = await prisma.program.findUnique({
			where: {
				departmentId_degreeType: {
					departmentId: existing.departmentId,
					degreeType: payload.degreeType,
				},
			},
		});

		if (duplicate) {
			throw new AppError(
				409,
				"A program with this degree type already exists in the department.",
			);
		}
	}

	return prisma.program.update({
		where: { id },
		data: payload,
		include: { department: true },
	});
};

export const deleteProgram = async (userId: string, id: string) => {
	const program = await getProgram(id);
	await ensureDepartmentManager(userId, program.departmentId);

	if (
		program._count.students > 0 ||
		program._count.curriculumCourses > 0 ||
		program._count.admissions > 0
	) {
		throw new AppError(
			409,
			"Cannot delete a program that has students, curriculum courses, or admissions.",
		);
	}

	await prisma.program.delete({ where: { id } });
};
