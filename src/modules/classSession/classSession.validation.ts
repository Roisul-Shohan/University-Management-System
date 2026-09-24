import { z } from "zod";

const id = z.string().min(1, "ID is required");
const date = z.coerce.date();

export const createClassSessionValidation = z.object({
	body: z
		.object({
			courseOfferingId: id,
			date,
			startTime: date,
			endTime: date,
			topic: z.string().trim().max(200).optional(),
			meetingLink: z.string().trim().url().max(500).optional(),
		})
		.refine((body) => body.startTime < body.endTime, {
			message: "Start time must be before end time.",
			path: ["endTime"],
		}),
});

export const updateClassSessionValidation = z.object({
	params: z.object({ id }),
	body: z
		.object({
			date: date.optional(),
			startTime: date.optional(),
			endTime: date.optional(),
			topic: z.string().trim().max(200).nullable().optional(),
			meetingLink: z.string().trim().url().max(500).nullable().optional(),
		})
		.refine((body) => Object.keys(body).length > 0, {
			message: "At least one field must be provided.",
		}),
});

export const classSessionIdValidation = z.object({
	params: z.object({ id }),
});

export const classSessionsQueryValidation = z.object({
	query: z.object({
		courseOfferingId: id.optional(),
		from: date.optional(),
		to: date.optional(),
	}),
});
