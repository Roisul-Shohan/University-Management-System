import { z } from "zod";

const id = z.string().min(1, "ID is required");
const option = z.object({
	optionText: z.string().trim().min(1).max(500),
	isCorrect: z.boolean(),
	order: z.number().int().positive(),
});
const options = z
	.array(option)
	.min(2, "At least two options are required.")
	.refine(
		(items) => new Set(items.map((item) => item.order)).size === items.length,
		{
			message: "Option orders must be unique.",
		},
	)
	.refine((items) => items.filter((item) => item.isCorrect).length === 1, {
		message: "Exactly one option must be correct.",
	});

export const createExamQuestionValidation = z.object({
	params: z.object({ examId: id }),
	body: z.object({
		questionText: z.string().trim().min(1).max(2000),
		marks: z.number().int().positive().max(1000),
		order: z.number().int().positive(),
		options,
	}),
});

export const updateExamQuestionValidation = z.object({
	params: z.object({ examId: id, questionId: id }),
	body: z
		.object({
			questionText: z.string().trim().min(1).max(2000).optional(),
			marks: z.number().int().positive().max(1000).optional(),
			order: z.number().int().positive().optional(),
			options: options.optional(),
		})
		.refine((body) => Object.keys(body).length > 0, {
			message: "At least one field must be provided.",
		}),
});

export const examQuestionIdValidation = z.object({
	params: z.object({ examId: id, questionId: id }),
});
