import type { ExamStatus, ExamType } from "../../../generated/prisma/enums.js";

export interface CreateExamInput {
	courseOfferingId: string;
	type: ExamType;
	title: string;
	durationMinutes: number;
	totalMarks: number;
	startAt?: Date | null;
	endAt?: Date | null;
}

export interface UpdateExamInput {
	type?: ExamType;
	title?: string;
	durationMinutes?: number;
	totalMarks?: number;
	startAt?: Date | null;
	endAt?: Date | null;
}

export interface GetExamsQuery {
	courseOfferingId?: string;
	status?: ExamStatus;
	type?: ExamType;
}
