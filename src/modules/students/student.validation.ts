import { z } from "zod";

export const createStudentValidation = z.object({
	params: z.object({
		admissionId: z.uuid("Invalid admission ID"),
	}),
});

export const getStudentValidation = z.object({
	params: z.object({
		studentId: z
			.string()
			.trim()
			.min(1, "Student ID is required"),
	}),
});

export const getStudentsValidation = z.object({
	query: z.object({
		programId: z.uuid("Invalid program ID").optional(),

		departmentId: z.uuid("Invalid department ID").optional(),

		admissionYear: z.coerce
			.number()
			.int()
			.min(2000)
			.max(2100)
			.optional(),

		currentYear: z.coerce
			.number()
			.int()
			.min(1)
			.max(4)
			.optional(),

		currentSemester: z.coerce
			.number()
			.int()
			.min(1)
			.max(2)
			.optional(),

		isActive: z
			.enum(["true", "false"])
			.transform((value) => value === "true")
			.optional(),
	}),
});