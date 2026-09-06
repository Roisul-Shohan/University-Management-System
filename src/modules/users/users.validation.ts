import { z } from "zod";

export const getUsersQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),

	limit: z.coerce.number().int().min(1).max(100).default(10),

	search: z.string().trim().optional(),

	role: z.enum(["STUDENT", "TEACHER", "SUPER_ADMIN"]).optional(),

	status: z.enum(["ACTIVE", "SUSPENDED", "DISABLED"]).optional(),

	sortBy: z
		.enum(["name", "email", "createdAt", "updatedAt"])
		.default("createdAt"),

	sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const updateProfileSchema = z.object({
	name: z
		.string()
		.trim()
		.min(2, "Name must be at least 2 characters long")
		.max(100, "Name cannot exceed 100 characters")
		.optional(),

	address: z
		.string()
		.trim()
		.max(255, "Address cannot exceed 255 characters")
		.optional(),

	email: z
		.string()
		.trim()
		.email("Please provide a valid email address")
		.toLowerCase()
		.optional(),

	password: z
		.string()
		.min(6, "Password must be at least 6 characters long")
		.max(100, "Password cannot exceed 100 characters")
		.optional(),
});

export const updateUserStatusSchema = z.object({
	status: z.enum(["ACTIVE", "SUSPENDED", "DISABLED"]),
});
