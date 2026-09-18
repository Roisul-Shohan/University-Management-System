import { z } from "zod";

const idSchema = z.string().uuid("Invalid ID.");
const degreeTypeSchema = z.enum(["BSC", "MSC", "PHD"]);

export const createProgramValidation = z.object({
	body: z.object({
		departmentId: idSchema,
		degreeType: degreeTypeSchema,
	}),
});

export const updateProgramValidation = z.object({
	params: z.object({
		id: idSchema,
	}),
	body: z
		.object({
			degreeType: degreeTypeSchema.optional(),
		})
		.refine((body) => body.degreeType !== undefined, {
			message: "At least one field must be provided.",
		}),
});

export const programIdValidation = z.object({
	params: z.object({
		id: idSchema,
	}),
});

export const programsQueryValidation = z.object({
	query: z.object({
		departmentId: idSchema.optional(),
	}),
});
