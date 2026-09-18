import { z } from "zod";

export const initiateSemesterPaymentValidation = z.object({
  params: z.object({
    studentSemesterId: z.string({
      message: "Student Semester ID is required",
    }),
  }),
});
