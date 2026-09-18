import { z } from "zod";

export const createAdmissionPaymentValidation = z.object({
	params: z.object({
		admissionId: z.uuid("Invalid admission ID"),
	}),
});

export const executePaymentValidation = z.object({
	body: z.object({
		paymentID: z.string().trim().min(1, "Payment ID is required"),
	}),
});

export const getPaymentStatusValidation = z.object({
	params: z.object({
		transactionId: z.uuid("Invalid transaction ID"),
	}),
});

export const bkashCallbackValidation = z.object({
	query: z.object({
		paymentID: z.string().trim().min(1),
		status: z.string().trim().optional(),
	}),
});
