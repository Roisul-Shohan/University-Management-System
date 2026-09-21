import { z } from "zod";

const idSchema = z.string().uuid("Invalid ID.");

export const createAdmissionFeeValidation = z.object({
  body: z.object({
    programId: idSchema,
    amount: z
      .number({ message: "Amount is required" })
      .positive("Amount must be greater than zero"),
    isActive: z.boolean().optional(),
  }),
});

export const updateAdmissionFeeValidation = z.object({
  params: z.object({
    id: idSchema,
  }),
  body: z
    .object({
      amount: z
        .number()
        .positive("Amount must be greater than zero")
        .optional(),
      isActive: z.boolean().optional(),
    })
    .refine(
      (body) => body.amount !== undefined || body.isActive !== undefined,
      { message: "At least one field must be provided" },
    ),
});

export const admissionFeeIdValidation = z.object({
  params: z.object({
    id: idSchema,
  }),
});
