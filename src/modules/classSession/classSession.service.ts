import AppError from "../../errors/AppErrors.js";
import { prisma } from "../../lib/prisma.js";
import { Role } from "../../../generated/prisma/enums.js";
import type {
	CreateClassSessionInput,
	GetClassSessionsQuery,
	UpdateClassSessionInput,
} from "./classSession.interface.js";

const include = {
	courseOffering: {
		include: {
			course: { include: { department: true } },
			teacher: {
				include: { user: { select: { id: true, name: true, email: true } } },
			},
		},
	},
	attendanceSession: true,
};

const ensureAccess = async (
	userId: string,
	teacherId: string,
	departmentId: string,
) => {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: { teacher: true },
	});
	if (!user) throw new AppError(404, "User not found.");

	const allowed =
		user.role === Role.SUPER_ADMIN ||
		(user.role === Role.TEACHER &&
			(user.id === teacherId ||
				(user.teacher?.isDeptAdmin === true &&
					user.teacher.departmentId === departmentId)));
	if (!allowed) {
		throw new AppError(
			403,
			"Only the assigned teacher, department admin, or super admin can manage class sessions.",
		);
	}
};

const ensureNoOverlap = async (
	courseOfferingId: string,
	startTime: Date,
	endTime: Date,
	id?: string,
) => {
	const overlap = await prisma.classSession.findFirst({
		where: {
			courseOfferingId,
			id: id ? { not: id } : undefined,
			startTime: { lt: endTime },
			endTime: { gt: startTime },
		},
	});
	if (overlap)
		throw new AppError(409, "This class session overlaps another session.");
};

export const createClassSession = async (
	userId: string,
	payload: CreateClassSessionInput,
) => {
	const offering = await prisma.courseOffering.findUnique({
		where: { id: payload.courseOfferingId },
		include: { course: true },
	});
	if (!offering) throw new AppError(404, "Course offering not found.");
	await ensureAccess(userId, offering.teacherId, offering.course.departmentId);
	await ensureNoOverlap(
		payload.courseOfferingId,
		payload.startTime,
		payload.endTime,
	);

	return prisma.classSession.create({ data: payload, include });
};

export const getClassSessions = async (query: GetClassSessionsQuery) =>
	prisma.classSession.findMany({
		where: {
			courseOfferingId: query.courseOfferingId,
			startTime:
				query.from || query.to ? { gte: query.from, lte: query.to } : undefined,
		},
		include,
		orderBy: { startTime: "asc" },
	});

export const getClassSessionById = async (id: string) => {
	const session = await prisma.classSession.findUnique({
		where: { id },
		include,
	});
	if (!session) throw new AppError(404, "Class session not found.");
	return session;
};

export const updateClassSession = async (
	userId: string,
	id: string,
	payload: UpdateClassSessionInput,
) => {
	const existing = await prisma.classSession.findUnique({
		where: { id },
		include: { courseOffering: { include: { course: true } } },
	});
	if (!existing) throw new AppError(404, "Class session not found.");
	await ensureAccess(
		userId,
		existing.courseOffering.teacherId,
		existing.courseOffering.course.departmentId,
	);

	const startTime = payload.startTime ?? existing.startTime;
	const endTime = payload.endTime ?? existing.endTime;
	if (startTime >= endTime) {
		throw new AppError(400, "Start time must be before end time.");
	}
	await ensureNoOverlap(existing.courseOfferingId, startTime, endTime, id);

	return prisma.classSession.update({ where: { id }, data: payload, include });
};

export const deleteClassSession = async (userId: string, id: string) => {
	const existing = await prisma.classSession.findUnique({
		where: { id },
		include: {
			courseOffering: { include: { course: true } },
			attendanceSession: { select: { id: true } },
		},
	});
	if (!existing) throw new AppError(404, "Class session not found.");
	await ensureAccess(
		userId,
		existing.courseOffering.teacherId,
		existing.courseOffering.course.departmentId,
	);
	if (existing.attendanceSession) {
		throw new AppError(
			409,
			"Cannot delete a class session with attendance records.",
		);
	}
	await prisma.classSession.delete({ where: { id } });
};
