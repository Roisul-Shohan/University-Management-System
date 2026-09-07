import { z } from "zod";

export const createAcademicPeriodSchema = z
	.object({
		type: z.enum([
			"ADMISSION",
			"SEMESTER_REGISTRATION",
			"COURSE_REGISTRATION",
			"MIDTERM_EXAM",
			"FINAL_EXAM",
			"RESULT_PUBLICATION",
		]),

		startDate: z.coerce.date({
			error: "Start date is required.",
		}),

		endDate: z.coerce.date({
			error: "End date is required.",
		}),
	})
	.refine((data) => data.startDate < data.endDate, {
		message: "Start date must be before end date.",
		path: ["startDate"],
	});

export const getAcademicPeriodsQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),

	limit: z.coerce.number().int().min(1).max(100).default(10),

	type: z
		.enum([
			"ADMISSION",
			"SEMESTER_REGISTRATION",
			"COURSE_REGISTRATION",
			"MIDTERM_EXAM",
			"FINAL_EXAM",
			"RESULT_PUBLICATION",
		])
		.optional(),

	isActive: z
		.enum(["true", "false"])
		.transform((value) => value === "true")
		.optional(),

	sortBy: z.enum(["startDate", "endDate", "createdAt"]).default("startDate"),

	sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const getAcademicPeriodByIdSchema = z.object({
	id: z.string().uuid("Invalid academic period ID."),
});

export const updateAcademicPeriodSchema = z
	.object({
		type: z
			.enum([
				"ADMISSION",
				"SEMESTER_REGISTRATION",
				"COURSE_REGISTRATION",
				"MIDTERM_EXAM",
				"FINAL_EXAM",
				"RESULT_PUBLICATION",
			])
			.optional(),

		startDate: z.coerce.date().optional(),

		endDate: z.coerce.date().optional(),
	})
	.refine(
		(data) =>
			data.type !== undefined ||
			data.startDate !== undefined ||
			data.endDate !== undefined,
		{
			message: "At least one field must be provided.",
		},
	)
	.refine(
		(data) =>
			data.startDate === undefined ||
			data.endDate === undefined ||
			data.startDate < data.endDate,
		{
			message: "Start date must be before end date.",
			path: ["startDate"],
		},
	);

export const updateAcademicPeriodRequestSchema = z.object({
	params: z.object({
		id: z.string().uuid("Invalid academic period ID."),
	}),

	body: updateAcademicPeriodSchema,
});

export const updateAcademicPeriodStatusSchema = z.object({
	params: z.object({
		id: z.string().uuid("Invalid academic period ID."),
	}),

	body: z.object({
		isActive: z.boolean(),
	}),
});
