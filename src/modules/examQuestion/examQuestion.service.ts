import { ExamStatus, Role } from "../../../generated/prisma/enums.js";
import AppError from "../../errors/AppErrors.js";
import { prisma } from "../../lib/prisma.js";
import type {
	CreateExamQuestionInput,
	UpdateExamQuestionInput,
} from "./examQuestion.interface.js";

const questionInclude = {
	options: { orderBy: { order: "asc" as const } },
};

const getExam = async (examId: string) => {
	const exam = await prisma.exam.findUnique({
		where: { id: examId },
		include: { courseOffering: { include: { course: true } } },
	});
	if (!exam) throw new AppError(404, "Exam not found.");
	return exam;
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
			"Only the assigned teacher, department admin, or super admin can manage questions.",
		);
	}
};

const ensureDraft = (status: ExamStatus) => {
	if (status !== ExamStatus.DRAFT) {
		throw new AppError(409, "Only draft exams can be modified.");
	}
};

const ensureMarksWithinTotal = async (
	examId: string,
	marks: number,
	questionId?: string,
) => {
	const aggregate = await prisma.examQuestion.aggregate({
		where: { examId, id: questionId ? { not: questionId } : undefined },
		_sum: { marks: true },
	});
	if (
		(aggregate._sum.marks ?? 0) + marks >
		(await getExam(examId)).totalMarks
	) {
		throw new AppError(
			409,
			"Question marks cannot exceed the exam total marks.",
		);
	}
};

const ensureUniqueOrder = async (
	examId: string,
	order: number,
	questionId?: string,
) => {
	const existing = await prisma.examQuestion.findFirst({
		where: { examId, order, id: questionId ? { not: questionId } : undefined },
	});
	if (existing)
		throw new AppError(409, "A question with this order already exists.");
};

export const createExamQuestion = async (
	userId: string,
	examId: string,
	payload: CreateExamQuestionInput,
) => {
	const exam = await getExam(examId);
	ensureDraft(exam.status);
	await ensureManager(
		userId,
		exam.courseOffering.teacherId,
		exam.courseOffering.course.departmentId,
	);
	await ensureMarksWithinTotal(examId, payload.marks);
	await ensureUniqueOrder(examId, payload.order);

	return prisma.examQuestion.create({
		data: {
			examId,
			questionText: payload.questionText,
			marks: payload.marks,
			order: payload.order,
			options: { create: payload.options },
		},
		include: questionInclude,
	});
};

export const getExamQuestions = async (examId: string, userId: string) => {
	const exam = await getExam(examId);
	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user) throw new AppError(404, "User not found.");
	if (exam.status !== ExamStatus.PUBLISHED && user.role === Role.STUDENT) {
		throw new AppError(404, "Exam not found.");
	}

	const questions = await prisma.examQuestion.findMany({
		where: { examId },
		include: questionInclude,
		orderBy: { order: "asc" },
	});

	if (user.role !== Role.STUDENT) return questions;

	return questions.map(({ options, ...question }) => ({
		...question,
		options: options.map(({ isCorrect: _isCorrect, ...option }) => option),
	}));
};

export const updateExamQuestion = async (
	userId: string,
	examId: string,
	questionId: string,
	payload: UpdateExamQuestionInput,
) => {
	const exam = await getExam(examId);
	ensureDraft(exam.status);
	await ensureManager(
		userId,
		exam.courseOffering.teacherId,
		exam.courseOffering.course.departmentId,
	);
	const question = await prisma.examQuestion.findUnique({
		where: { id: questionId },
	});
	if (!question || question.examId !== examId) {
		throw new AppError(404, "Exam question not found.");
	}

	if (payload.marks !== undefined && payload.marks !== question.marks) {
		await ensureMarksWithinTotal(examId, payload.marks, questionId);
	}
	if (payload.order !== undefined && payload.order !== question.order) {
		await ensureUniqueOrder(examId, payload.order, questionId);
	}

	return prisma.$transaction(async (tx) => {
		if (payload.options) {
			await tx.questionOption.deleteMany({ where: { questionId } });
		}
		return tx.examQuestion.update({
			where: { id: questionId },
			data: {
				questionText: payload.questionText,
				marks: payload.marks,
				order: payload.order,
				options: payload.options ? { create: payload.options } : undefined,
			},
			include: questionInclude,
		});
	});
};

export const deleteExamQuestion = async (
	userId: string,
	examId: string,
	questionId: string,
) => {
	const exam = await getExam(examId);
	ensureDraft(exam.status);
	await ensureManager(
		userId,
		exam.courseOffering.teacherId,
		exam.courseOffering.course.departmentId,
	);
	const question = await prisma.examQuestion.findUnique({
		where: { id: questionId },
	});
	if (!question || question.examId !== examId) {
		throw new AppError(404, "Exam question not found.");
	}
	await prisma.examQuestion.delete({ where: { id: questionId } });
};
