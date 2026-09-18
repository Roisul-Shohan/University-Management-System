import { z } from "zod";

export const createSemesterFeeValidation = z.object({
    body: z.object({
        programId: z.string({
            message: "Program ID is required",
        }),
        amount: z.number({
            message: "Amount is required",
        }).min(0),
    }),
});

export const updateSemesterFeeValidation = z.object({
    body: z.object({
        amount: z.number().min(0).optional(),
        isActive: z.boolean().optional(),
    }),
});
