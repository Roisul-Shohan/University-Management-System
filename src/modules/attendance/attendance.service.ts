import { randomBytes } from "node:crypto";
import {
	AttendanceSessionStatus,
	AttendanceStatus,
	EnrollmentStatus,
	Role,
} from "../../../generated/prisma/enums.js";
import AppError from "../../errors/AppErrors.js";
import { prisma } from "../../lib/prisma.js";
import type {
	MarkAttendanceInput,
	OpenAttendanceSessionInput,
	UpdateAttendanceRecordInput,
} from "./attendance.interface.js";

const sessionInclude = {
	classSession: {
		include: {
			courseOffering: {
				include: {
					course: { include: { department: true } },
					teacher: { include: { user: { select: { id: true, name: true } } } },
				},
			},
		},
	},
	attendanceRecords: {
		include: {
			courseEnrollment: {
				include: {
					studentSemester: {
						include: { student: { include: { user: true } } },
					},
				},
			},
		},
	},
} as const;

const ensureSessionManager = async (
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
			"Only the assigned teacher, department admin, or super admin can manage attendance.",
		);
	}
};

export const openAttendanceSession = async (
	userId: string,
	payload: OpenAttendanceSessionInput,
) => {
	const classSession = await prisma.classSession.findUnique({
		where: { id: payload.classSessionId },
		include: { courseOffering: { include: { course: true } } },
	});
	if (!classSession) throw new AppError(404, "Class session not found.");
	await ensureSessionManager(
		userId,
		classSession.courseOffering.teacherId,
		classSession.courseOffering.course.departmentId,
	);

	const existing = await prisma.attendanceSession.findUnique({
		where: { classSessionId: payload.classSessionId },
	});
	if (existing) {
		throw new AppError(
			409,
			"Attendance has already been opened for this class.",
		);
	}

	const openedAt = new Date();
	const expiresAt = new Date(
		openedAt.getTime() + (payload.durationMinutes ?? 30) * 60_000,
	);
	return prisma.attendanceSession.create({
		data: {
			classSessionId: payload.classSessionId,
			qrToken: randomBytes(32).toString("hex"),
			openedAt,
			expiresAt,
		},
		include: sessionInclude,
	});
};

export const closeAttendanceSession = async (userId: string, id: string) => {
	const session = await prisma.attendanceSession.findUnique({
		where: { id },
		include: {
			classSession: {
				include: { courseOffering: { include: { course: true } } },
			},
		},
	});
	if (!session) throw new AppError(404, "Attendance session not found.");
	await ensureSessionManager(
		userId,
		session.classSession.courseOffering.teacherId,
		session.classSession.courseOffering.course.departmentId,
	);
	if (session.status !== AttendanceSessionStatus.OPEN) {
		throw new AppError(409, "Attendance session is already closed.");
	}

	return prisma.attendanceSession.update({
		where: { id },
		data: { status: AttendanceSessionStatus.CLOSED },
		include: sessionInclude,
	});
};

export const getAttendanceSession = async (id: string, userId: string) => {
	const session = await prisma.attendanceSession.findUnique({
		where: { id },
		include: sessionInclude,
	});
	if (!session) throw new AppError(404, "Attendance session not found.");
	if (
		session.status === AttendanceSessionStatus.OPEN &&
		session.expiresAt <= new Date()
	) {
		const updated = await prisma.attendanceSession.update({
			where: { id },
			data: { status: AttendanceSessionStatus.EXPIRED },
			include: sessionInclude,
		});
		return getSessionView(updated, userId);
	}
	return getSessionView(session, userId);
};

const getSessionView = async <
	T extends {
		qrToken: string;
		classSession: {
			courseOffering: {
				teacherId: string;
				course: { departmentId: string };
			};
		};
	},
>(
	session: T,
	userId: string,
) => {
	const viewer = await prisma.user.findUnique({
		where: { id: userId },
		include: { teacher: true },
	});
	if (!viewer) throw new AppError(404, "User not found.");

	const isManager =
		viewer.role === Role.SUPER_ADMIN ||
		(viewer.role === Role.TEACHER &&
			(viewer.id === session.classSession.courseOffering.teacherId ||
				(viewer.teacher?.isDeptAdmin === true &&
					viewer.teacher.departmentId ===
						session.classSession.courseOffering.course.departmentId)));

	if (isManager) return session;

	const { qrToken: _qrToken, ...safeSession } = session;
	return safeSession;
};

export const markAttendance = async (
	userId: string,
	input: MarkAttendanceInput,
) => {
	const session = await prisma.attendanceSession.findUnique({
		where: { id: input.attendanceSessionId },
		include: { classSession: true },
	});
	if (!session) throw new AppError(404, "Attendance session not found.");
	if (session.qrToken !== input.qrToken) {
		throw new AppError(401, "Invalid attendance QR token.");
	}
	if (
		session.status !== AttendanceSessionStatus.OPEN ||
		session.expiresAt <= new Date()
	) {
		throw new AppError(409, "Attendance session is no longer open.");
	}

	const enrollment = await prisma.courseEnrollment.findFirst({
		where: {
			status: EnrollmentStatus.ENROLLED,
			studentSemester: { student: { id: userId } },
			courseOfferingId: session.classSession.courseOfferingId,
		},
	});
	if (!enrollment) {
		throw new AppError(403, "You are not enrolled in this course.");
	}

	return prisma.attendanceRecord.upsert({
		where: {
			attendanceSessionId_courseEnrollmentId: {
				attendanceSessionId: session.id,
				courseEnrollmentId: enrollment.id,
			},
		},
		create: {
			attendanceSessionId: session.id,
			courseEnrollmentId: enrollment.id,
			status: AttendanceStatus.PRESENT,
		},
		update: {
			status: AttendanceStatus.PRESENT,
			markedAt: new Date(),
		},
	});
};

export const updateAttendanceRecord = async (
	userId: string,
	sessionId: string,
	recordId: string,
	payload: UpdateAttendanceRecordInput,
) => {
	const record = await prisma.attendanceRecord.findUnique({
		where: { id: recordId },
		include: {
			attendanceSession: {
				include: {
					classSession: {
						include: { courseOffering: { include: { course: true } } },
					},
				},
			},
		},
	});
	if (!record || record.attendanceSessionId !== sessionId) {
		throw new AppError(404, "Attendance record not found.");
	}
	const offering = record.attendanceSession.classSession.courseOffering;
	await ensureSessionManager(
		userId,
		offering.teacherId,
		offering.course.departmentId,
	);

	return prisma.attendanceRecord.update({
		where: { id: recordId },
		data: { status: payload.status },
	});
};
