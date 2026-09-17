import { z } from "zod";

export const createAdmissionValidation = z.object({
	body: z.object({
		programId: z.uuid("Invalid program ID"),
		admissionYear: z
			.number()
			.int("Admission year must be an integer")
			.min(2000, "Invalid admission year")
			.max(2100, "Invalid admission year"),
	}),
});

export const admissionIdValidation = z.object({
	params: z.object({
		admissionId: z.uuid("Invalid admission ID"),
	}),
});

export const getAdmissionsValidation = z.object({
	query: z.object({
		status: z
			.enum(["PENDING", "APPROVED", "REJECTED", "CONFIRMED", "CANCELLED"])
			.optional(),

		admissionYear: z.coerce.number().int().min(2000).max(2100).optional(),

		programId: z.uuid("Invalid program ID").optional(),
	}),
});
