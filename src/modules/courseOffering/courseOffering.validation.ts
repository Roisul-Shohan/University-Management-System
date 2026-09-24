import { z } from "zod";

const id = z.string().min(1, "ID is required");
const term = z.number().int().min(1, "Must be at least 1");
const capacity = z
	.number()
	.int()
	.positive("Capacity must be greater than zero");

export const createCourseOfferingValidation = z.object({
	body: z.object({
		courseId: id,
		teacherId: id,
		year: term,
		semester: term,
		capacity: capacity.nullable().optional(),
	}),
});

export const updateCourseOfferingValidation = z.object({
	params: z.object({ id }),
	body: z
		.object({
			teacherId: id.optional(),
			year: term.optional(),
			semester: term.optional(),
			capacity: capacity.nullable().optional(),
		})
		.refine((body) => Object.keys(body).length > 0, {
			message: "At least one field must be provided",
		}),
});

export const courseOfferingIdValidation = z.object({
	params: z.object({ id }),
});

export const courseOfferingsQueryValidation = z.object({
	query: z.object({
		courseId: id.optional(),
		teacherId: id.optional(),
		year: z.coerce.number().int().min(1).optional(),
		semester: z.coerce.number().int().min(1).optional(),
	}),
});
