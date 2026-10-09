import {
	ExamStatus,
	EnrollmentStatus,
	StudentSemesterStatus,
} from "../../../generated/prisma/enums.js";
import AppError from "../../errors/AppErrors.js";
import { prisma } from "../../lib/prisma.js";
import type { SubmitExamAttemptInput } from "./examAttempt.interface.js";

const attemptInclude = {
	exam: {
		include: {
			courseOffering: { include: { course: true } },
			questions: {
				include: { options: { orderBy: { order: "asc" as const } } },
				orderBy: { order: "asc" as const },
			},
		},
	},
	answers: true,
	studentSemester: true,
};

const getStudentSemester = async (userId: string, examId: string) => {
	const exam = await prisma.exam.findUnique({
		where: { id: examId },
		include: { courseOffering: true },
	});
	if (!exam) throw new AppError(404, "Exam not found.");

	const studentSemester = await prisma.studentSemester.findFirst({
		where: {
			student: { id: userId },
			year: exam.courseOffering.year,
			semester: exam.courseOffering.semester,
			status: {
				in: [StudentSemesterStatus.REGISTERED, StudentSemesterStatus.ACTIVE],
			},
			courseEnrollments: {
				some: {
					courseOfferingId: exam.courseOfferingId,
					status: EnrollmentStatus.ENROLLED,
				},
			},
		},
	});
	if (!studentSemester) {
		throw new AppError(403, "You are not enrolled in this exam's course.");
	}

	return { exam, studentSemester };
};

const ensureExamIsOpen = (exam: {
	status: ExamStatus;
	startAt: Date | null;
	endAt: Date | null;
}) => {
	const now = new Date();
	if (exam.status !== ExamStatus.PUBLISHED) {
		throw new AppError(409, "This exam is not available.");
	}
	if (exam.startAt && now < exam.startAt) {
		throw new AppError(409, "This exam has not started yet.");
	}
	if (exam.endAt && now >= exam.endAt) {
		throw new AppError(409, "This exam has ended.");
	}
};

export const startExamAttempt = async (userId: string, examId: string) => {
	const { exam, studentSemester } = await getStudentSemester(userId, examId);
	ensureExamIsOpen(exam);

	const existing = await prisma.examAttempt.findUnique({
		where: {
			examId_studentSemesterId: {
				examId,
				studentSemesterId: studentSemester.id,
			},
		},
		include: attemptInclude,
	});
	if (existing) return getExamAttempt(userId, existing.id);

	const now = new Date();
	const scheduledEnd = exam.endAt?.getTime() ?? Number.POSITIVE_INFINITY;
	const durationEnd = now.getTime() + exam.durationMinutes * 60_000;
	const expiresAt = new Date(Math.min(scheduledEnd, durationEnd));

	const attempt = await prisma.examAttempt.create({
		data: {
			examId,
			studentSemesterId: studentSemester.id,
			startedAt: now,
			expiresAt,
		},
		include: attemptInclude,
	});

	return getExamAttempt(userId, attempt.id);
};

export const getExamAttempt = async (userId: string, attemptId: string) => {
	const attempt = await prisma.examAttempt.findUnique({
		where: { id: attemptId },
		include: attemptInclude,
	});
	if (!attempt) throw new AppError(404, "Exam attempt not found.");
	if (attempt.studentSemester.studentId !== userId) {
		throw new AppError(403, "You are not authorized to view this attempt.");
	}

	const { exam, answers, studentSemester, ...safeAttempt } = attempt;
	return {
		...safeAttempt,
		exam: {
			...exam,
			questions: exam.questions.map(({ options, ...question }) => ({
				...question,
				options: options.map(({ isCorrect: _isCorrect, ...option }) => option),
			})),
		},
		answers,
		studentSemester,
	};
};

export const submitExamAttempt = async (
	userId: string,
	attemptId: string,
	payload: SubmitExamAttemptInput,
) => {
	const attempt = await prisma.examAttempt.findUnique({
		where: { id: attemptId },
		include: {
			exam: { include: { questions: { include: { options: true } } } },
			studentSemester: true,
		},
	});
	if (!attempt) throw new AppError(404, "Exam attempt not found.");
	if (attempt.studentSemester.studentId !== userId) {
		throw new AppError(403, "You are not authorized to submit this attempt.");
	}
	if (attempt.submittedAt) {
		throw new AppError(409, "This exam attempt has already been submitted.");
	}
	if (new Date() >= attempt.expiresAt) {
		throw new AppError(409, "This exam attempt has expired.");
	}

	const questionMap = new Map(
		attempt.exam.questions.map((question) => [question.id, question]),
	);
	const submittedQuestionIds = new Set<string>();
	let score = 0;

	for (const answer of payload.answers) {
		if (submittedQuestionIds.has(answer.questionId)) {
			throw new AppError(400, "Each question can only be answered once.");
		}
		submittedQuestionIds.add(answer.questionId);

		const question = questionMap.get(answer.questionId);
		if (!question)
			throw new AppError(400, "Answer contains an invalid question.");

		if (answer.optionId) {
			const option = question.options.find(
				(item) => item.id === answer.optionId,
			);
			if (!option) {
				throw new AppError(
					400,
					"Answer option does not belong to its question.",
				);
			}
			if (option.isCorrect) score += question.marks;
		}
	}

	const submittedAt = new Date();
	return prisma.$transaction(async (tx) => {
		await tx.studentAnswer.createMany({
			data: payload.answers.map((answer) => ({
				examAttemptId: attemptId,
				questionId: answer.questionId,
				optionId: answer.optionId ?? null,
			})),
		});
		return tx.examAttempt.update({
			where: { id: attemptId, submittedAt: null },
			data: { submittedAt, score },
			include: { answers: true },
		});
	});
};

export const listExamAttempts = async (userId: string) => {
	const student = await prisma.student.findFirst({
		where: { id: userId },
		select: { id: true },
	});
	if (!student) throw new AppError(404, "Student profile not found.");

	const studentSemesters = await prisma.studentSemester.findMany({
		where: { studentId: student.id },
		select: { id: true },
	});
	const studentSemesterIds = studentSemesters.map((s) => s.id);

	return prisma.examAttempt.findMany({
		where: { studentSemesterId: { in: studentSemesterIds } },
		include: {
			exam: {
				include: {
					courseOffering: { include: { course: true } },
				},
			},
		},
		orderBy: { startedAt: "desc" },
	});
};
