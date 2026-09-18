import { z } from "zod";

export const createCreditFeeValidation = z.object({
    body: z.object({
        programId: z.string().min(1, "Program ID is required"),
        amount: z.number({
            message: "Amount is required",
        }).positive("Amount must be greater than zero"),
        isActive: z.boolean().optional(),
    }),
});

export const updateCreditFeeValidation = z.object({
    params: z.object({
        id: z.string().min(1, "Credit fee ID is required"),
    }),
    body: z.object({
        amount: z.number().positive("Amount must be greater than zero").optional(),
        isActive: z.boolean().optional(),
    }).refine((body) => body.amount !== undefined || body.isActive !== undefined, {
        message: "At least one field must be provided",
    }),
});

export const creditFeeIdValidation = z.object({
    params: z.object({
        id: z.string().min(1, "Credit fee ID is required"),
    }),
});
