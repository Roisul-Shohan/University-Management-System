export interface StartExamAttemptInput {
	examId: string;
}

export interface SubmitExamAttemptInput {
	answers: Array<{
		questionId: string;
		optionId?: string | null;
	}>;
}
