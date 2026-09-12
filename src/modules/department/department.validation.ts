import { z } from "zod";

export const createDepartmentSchema = z.object({
	body: z.object({
		name: z
			.string()
			.trim()
			.min(2, "Department name must be at least 2 characters.")
			.max(100, "Department name cannot exceed 100 characters."),

		code: z
			.string()
			.trim()
			.min(2, "Department code must be at least 2 characters.")
			.max(10, "Department code cannot exceed 10 characters.")
			.toUpperCase(),
	}),
});

export const updateDepartmentSchema = z.object({
	body: z.object({
		name: z
			.string()
			.trim()
			.min(2, "Department name must be at least 2 characters.")
			.max(100, "Department name cannot exceed 100 characters.")
			.optional(),

		code: z
			.string()
			.trim()
			.min(2, "Department code must be at least 2 characters.")
			.max(10, "Department code cannot exceed 10 characters.")
			.toUpperCase()
			.optional(),
	}),

	params: z.object({
		id: z.string().regex(/^\d+$/, "Invalid department ID."),
	}),
});

export const departmentIdSchema = z.object({
	params: z.object({
		id: z.string().regex(/^\d+$/, "Invalid department ID."),
	}),
});