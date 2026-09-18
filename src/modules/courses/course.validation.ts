import { z } from "zod";

export const createCourseValidation = z.object({
  body: z.object({
    code: z.string().trim().min(2).max(30),
    name: z.string().trim().min(2).max(150),
    credits: z.number().positive("Credits must be greater than zero"),
    departmentId: z.string().min(1, "Department ID is required"),
  }),
});

export const updateCourseValidation = z.object({
  params: z.object({
    id: z.string().min(1, "Course ID is required"),
  }),
  body: z
    .object({
      code: z.string().trim().min(2).max(30).optional(),
      name: z.string().trim().min(2).max(150).optional(),
      credits: z
        .number()
        .positive("Credits must be greater than zero")
        .optional(),
    })
    .refine(
      (body) =>
        body.code !== undefined ||
        body.name !== undefined ||
        body.credits !== undefined,
      { message: "At least one field must be provided" },
    ),
});

export const courseIdValidation = z.object({
  params: z.object({
    id: z.string().min(1, "Course ID is required"),
  }),
});

export const coursesQueryValidation = z.object({
  query: z.object({
    departmentId: z.string().min(1).optional(),
  }),
});
