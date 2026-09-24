import { z } from "zod";

const id = z.string().min(1, "ID is required");
const date = z.coerce.date();
const examFields = {
	type: z.enum(["MIDTERM", "FINAL"]),
	title: z.string().trim().min(2).max(200),
	durationMinutes: z.number().int().positive().max(600),
	totalMarks: z.number().int().positive().max(1000),
	startAt: date.nullable().optional(),
	endAt: date.nullable().optional(),
};

export const createExamValidation = z.object({
	body: z
		.object({ courseOfferingId: id, ...examFields })
		.refine(
			(body) =>
				body.startAt === null ||
				body.endAt === null ||
				body.startAt === undefined ||
				body.endAt === undefined ||
				body.startAt < body.endAt,
			{
				message: "Exam start time must be before end time.",
				path: ["endAt"],
			},
		),
});

export const updateExamValidation = z.object({
	params: z.object({ id }),
	body: z
		.object({
			type: examFields.type.optional(),
			title: examFields.title.optional(),
			durationMinutes: examFields.durationMinutes.optional(),
			totalMarks: examFields.totalMarks.optional(),
			startAt: examFields.startAt,
			endAt: examFields.endAt,
		})
		.refine((body) => Object.keys(body).length > 0, {
			message: "At least one field must be provided.",
		}),
});

export const examIdValidation = z.object({ params: z.object({ id }) });

export const examsQueryValidation = z.object({
	query: z.object({
		courseOfferingId: id.optional(),
		status: z.enum(["DRAFT", "PUBLISHED", "CLOSED"]).optional(),
		type: z.enum(["MIDTERM", "FINAL"]).optional(),
	}),
});
