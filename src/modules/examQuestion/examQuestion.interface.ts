export interface QuestionOptionInput {
	optionText: string;
	isCorrect: boolean;
	order: number;
}

export interface CreateExamQuestionInput {
	questionText: string;
	marks: number;
	order: number;
	options: QuestionOptionInput[];
}

export interface UpdateExamQuestionInput {
	questionText?: string;
	marks?: number;
	order?: number;
	options?: QuestionOptionInput[];
}
