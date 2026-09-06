import { z } from "zod";

export const registerSchema = z.object({
	name: z
		.string()
		.trim()
		.min(3, "Name must be at least 3 characters long")
		.max(100, "Name cannot exceed 100 characters"),

	email: z
		.string()
		.trim()
		.email("Please provide a valid email address")
		.toLowerCase(),

	password: z
		.string()
		.min(6, "Password must be at least 6 characters long")
		.max(100, "Password cannot exceed 100 characters"),

	role: z.enum(["STUDENT", "TEACHER"]),
});

export const verifyEmailSchema = z.object({
	email: z
		.string()
		.trim()
		.email("Please provide a valid email address")
		.toLowerCase(),

	otp: z.string().regex(/^\d{6}$/, "OTP must be a 6-digit number"),
});

export const loginSchema = z.object({
	email: z
		.string()
		.trim()
		.email("Please provide a valid email address")
		.toLowerCase(),

	password: z.string().min(6, "Password is required"),
});

export const forgotPasswordSchema = z.object({
	email: z
		.string()
		.trim()
		.email("Please provide a valid email address")
		.toLowerCase(),
});

export const resetPasswordSchema = z.object({
	email: z
		.string()
		.trim()
		.email("Please provide a valid email address")
		.toLowerCase(),

	otp: z.string().regex(/^\d{6}$/, "OTP must be a 6-digit number"),

	newPassword: z
		.string()
		.min(6, "Password must be at least 6 characters long")
		.max(100, "Password cannot exceed 100 characters"),
});
