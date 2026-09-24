import { ExamStatus, Role } from "../../../generated/prisma/enums.js";
import AppError from "../../errors/AppErrors.js";
import { prisma } from "../../lib/prisma.js";
import type {
	CreateExamInput,
	GetExamsQuery,
	UpdateExamInput,
} from "./exam.interface.js";

const include = {
	courseOffering: {
		include: {
			course: { include: { department: true } },
			teacher: {
				include: { user: { select: { id: true, name: true, email: true } } },
			},
		},
	},
	_count: { select: { questions: true, attempts: true } },
};

const ensureManager = async (
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
			"Only the assigned teacher, department admin, or super admin can manage exams.",
		);
	}
};

const ensureSchedule = (
	startAt: Date | null | undefined,
	endAt: Date | null | undefined,
) => {
	if (startAt && endAt && startAt >= endAt) {
		throw new AppError(400, "Exam start time must be before end time.");
	}
};

export const createExam = async (userId: string, payload: CreateExamInput) => {
	const offering = await prisma.courseOffering.findUnique({
		where: { id: payload.courseOfferingId },
		include: { course: true },
	});
	if (!offering) throw new AppError(404, "Course offering not found.");
	await ensureManager(userId, offering.teacherId, offering.course.departmentId);
	ensureSchedule(payload.startAt, payload.endAt);

	const duplicate = await prisma.exam.findFirst({
		where: { courseOfferingId: payload.courseOfferingId, type: payload.type },
	});
	if (duplicate) {
		throw new AppError(
			409,
			`A ${payload.type.toLowerCase()} exam already exists.`,
		);
	}

	return prisma.exam.create({ data: payload, include });
};

export const getExams = async (query: GetExamsQuery, userId: string) => {
	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user) throw new AppError(404, "User not found.");

	const where = {
		courseOfferingId: query.courseOfferingId,
		status: user.role === Role.STUDENT ? ExamStatus.PUBLISHED : query.status,
		type: query.type,
	};

	return prisma.exam.findMany({
		where,
		include,
		orderBy: [{ startAt: "asc" }, { createdAt: "desc" }],
	});
};

export const getExamById = async (id: string, userId: string) => {
	const exam = await prisma.exam.findUnique({ where: { id }, include });
	if (!exam) throw new AppError(404, "Exam not found.");
	if (
		exam.status !== ExamStatus.PUBLISHED &&
		(await prisma.user.findUnique({
			where: { id: userId, role: Role.STUDENT },
		}))
	) {
		throw new AppError(404, "Exam not found.");
	}
	return exam;
};

export const updateExam = async (
	userId: string,
	id: string,
	payload: UpdateExamInput,
) => {
	const existing = await prisma.exam.findUnique({
		where: { id },
		include: { courseOffering: { include: { course: true } } },
	});
	if (!existing) throw new AppError(404, "Exam not found.");
	await ensureManager(
		userId,
		existing.courseOffering.teacherId,
		existing.courseOffering.course.departmentId,
	);
	if (existing.status !== ExamStatus.DRAFT) {
		throw new AppError(409, "Only draft exams can be edited.");
	}

	const startAt =
		payload.startAt === undefined ? existing.startAt : payload.startAt;
	const endAt = payload.endAt === undefined ? existing.endAt : payload.endAt;
	ensureSchedule(startAt, endAt);

	if (payload.type && payload.type !== existing.type) {
		const duplicate = await prisma.exam.findFirst({
			where: {
				courseOfferingId: existing.courseOfferingId,
				type: payload.type,
			},
		});
		if (duplicate) throw new AppError(409, "This exam type already exists.");
	}

	return prisma.exam.update({ where: { id }, data: payload, include });
};

export const publishExam = async (userId: string, id: string) => {
	const exam = await prisma.exam.findUnique({
		where: { id },
		include: {
			courseOffering: { include: { course: true } },
			_count: { select: { questions: true } },
		},
	});
	if (!exam) throw new AppError(404, "Exam not found.");
	await ensureManager(
		userId,
		exam.courseOffering.teacherId,
		exam.courseOffering.course.departmentId,
	);
	if (exam.status !== ExamStatus.DRAFT) {
		throw new AppError(409, "Only draft exams can be published.");
	}
	if (exam._count.questions === 0) {
		throw new AppError(
			409,
			"An exam must have at least one question before publishing.",
		);
	}

	return prisma.exam.update({
		where: { id },
		data: { status: ExamStatus.PUBLISHED },
		include,
	});
};

export const closeExam = async (userId: string, id: string) => {
	const exam = await prisma.exam.findUnique({
		where: { id },
		include: { courseOffering: { include: { course: true } } },
	});
	if (!exam) throw new AppError(404, "Exam not found.");
	await ensureManager(
		userId,
		exam.courseOffering.teacherId,
		exam.courseOffering.course.departmentId,
	);
	if (exam.status !== ExamStatus.PUBLISHED) {
		throw new AppError(409, "Only published exams can be closed.");
	}

	return prisma.exam.update({
		where: { id },
		data: { status: ExamStatus.CLOSED },
		include,
	});
};

export const deleteExam = async (userId: string, id: string) => {
	const exam = await prisma.exam.findUnique({
		where: { id },
		include: {
			courseOffering: { include: { course: true } },
			_count: { select: { attempts: true } },
		},
	});
	if (!exam) throw new AppError(404, "Exam not found.");
	await ensureManager(
		userId,
		exam.courseOffering.teacherId,
		exam.courseOffering.course.departmentId,
	);
	if (exam.status !== ExamStatus.DRAFT || exam._count.attempts > 0) {
		throw new AppError(409, "Only unused draft exams can be deleted.");
	}
	await prisma.exam.delete({ where: { id } });
};
