import AppError from "../../errors/AppErrors.js";
import { prisma } from "../../lib/prisma.js";
import { Role } from "../../../generated/prisma/enums.js";
import type {
	CreateCourseOfferingInput,
	GetCourseOfferingsQuery,
	UpdateCourseOfferingInput,
} from "./courseOffering.interface.js";

const ensureManager = async (userId: string, departmentId: string) => {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: { teacher: true },
	});
	if (!user) throw new AppError(404, "User not found.");

	const allowed =
		user.role === Role.SUPER_ADMIN ||
		(user.role === Role.TEACHER &&
			user.teacher?.isDeptAdmin === true &&
			user.teacher.departmentId === departmentId);
	if (!allowed) {
		throw new AppError(
			403,
			"Only the department admin or super admin can manage course offerings.",
		);
	}
};

const ensureTeacher = async (teacherId: string, departmentId: string) => {
	const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
	if (!teacher) throw new AppError(404, "Teacher not found.");
	if (teacher.departmentId !== departmentId) {
		throw new AppError(400, "Teacher must belong to the course department.");
	}
};

const include = {
	course: { include: { department: true } },
	teacher: {
		include: { user: { select: { id: true, name: true, email: true } } },
	},
	_count: { select: { enrollments: true, classSession: true } },
};

export const createCourseOffering = async (
	userId: string,
	payload: CreateCourseOfferingInput,
) => {
	const course = await prisma.course.findUnique({
		where: { id: payload.courseId },
	});
	if (!course) throw new AppError(404, "Course not found.");
	await ensureManager(userId, course.departmentId);
	await ensureTeacher(payload.teacherId, course.departmentId);

	const duplicate = await prisma.courseOffering.findUnique({
		where: {
			courseId_teacherId_year_semester: {
				courseId: payload.courseId,
				teacherId: payload.teacherId,
				year: payload.year,
				semester: payload.semester,
			},
		},
	});
	if (duplicate)
		throw new AppError(409, "This course offering already exists.");

	return prisma.courseOffering.create({ data: payload, include });
};

export const getCourseOfferings = async (query: GetCourseOfferingsQuery) =>
	prisma.courseOffering.findMany({
		where: {
			courseId: query.courseId,
			teacherId: query.teacherId,
			year: query.year,
			semester: query.semester,
		},
		include,
		orderBy: [
			{ year: "desc" },
			{ semester: "desc" },
			{ course: { code: "asc" } },
		],
	});

export const getCourseOfferingById = async (id: string) => {
	const offering = await prisma.courseOffering.findUnique({
		where: { id },
		include,
	});
	if (!offering) throw new AppError(404, "Course offering not found.");
	return offering;
};

export const updateCourseOffering = async (
	userId: string,
	id: string,
	payload: UpdateCourseOfferingInput,
) => {
	const existing = await prisma.courseOffering.findUnique({
		where: { id },
		include: { course: true, _count: { select: { enrollments: true } } },
	});
	if (!existing) throw new AppError(404, "Course offering not found.");
	await ensureManager(userId, existing.course.departmentId);

	const teacherId = payload.teacherId ?? existing.teacherId;
	await ensureTeacher(teacherId, existing.course.departmentId);
	const year = payload.year ?? existing.year;
	const semester = payload.semester ?? existing.semester;
	const capacity =
		payload.capacity === undefined ? existing.capacity : payload.capacity;
	if (
		capacity !== null &&
		capacity !== undefined &&
		capacity < existing._count.enrollments
	) {
		throw new AppError(409, "Capacity cannot be less than current enrollment.");
	}

	const duplicate = await prisma.courseOffering.findFirst({
		where: {
			id: { not: id },
			courseId: existing.courseId,
			teacherId,
			year,
			semester,
		},
	});
	if (duplicate)
		throw new AppError(409, "This course offering already exists.");

	return prisma.courseOffering.update({
		where: { id },
		data: payload,
		include,
	});
};

export const deleteCourseOffering = async (userId: string, id: string) => {
	const existing = await prisma.courseOffering.findUnique({
		where: { id },
		include: {
			course: true,
			_count: { select: { enrollments: true, classSession: true, exam: true } },
		},
	});
	if (!existing) throw new AppError(404, "Course offering not found.");
	await ensureManager(userId, existing.course.departmentId);
	if (
		existing._count.enrollments ||
		existing._count.classSession ||
		existing._count.exam
	) {
		throw new AppError(
			409,
			"Cannot delete an offering with related academic records.",
		);
	}
	await prisma.courseOffering.delete({ where: { id } });
};
