import { z } from "zod";

export const getNotificationsQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),

	limit: z.coerce.number().int().min(1).max(100).default(10),

	isRead: z
		.enum(["true", "false"])
		.transform((value) => value === "true")
		.optional(),
});

export const getNotificationByIdSchema = z.object({
	params: z.object({
		id: z.string().uuid("Invalid notification ID."),
	}),
});

export const markNotificationAsReadSchema = z.object({
	params: z.object({
		id: z.string().uuid("Invalid notification ID."),
	}),
});
