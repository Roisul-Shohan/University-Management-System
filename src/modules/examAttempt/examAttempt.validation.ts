import { z } from "zod";

const id = z.string().min(1, "ID is required");

export const examAttemptExamIdValidation = z.object({
	params: z.object({ examId: id }),
});

export const examAttemptIdValidation = z.object({
	params: z.object({ attemptId: id }),
});

export const submitExamAttemptValidation = z.object({
	params: z.object({ attemptId: id }),
	body: z.object({
		answers: z
			.array(
				z.object({
					questionId: id,
					optionId: id.nullable().optional(),
				}),
			)
			.max(1000),
	}),
});
