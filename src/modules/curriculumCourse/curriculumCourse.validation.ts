import { z } from "zod";

export const createCurriculumCourseValidation = z.object({
  body: z.object({
    programId: z.string().min(1, "Program ID is required"),
    courseId: z.string().min(1, "Course ID is required"),
    year: z.number().int().min(1, "Year must be at least 1"),
    semester: z.number().int().min(1, "Semester must be at least 1"),
  }),
});

export const updateCurriculumCourseValidation = z.object({
  params: z.object({
    id: z.string().min(1, "Curriculum course ID is required"),
  }),
  body: z
    .object({
      programId: z.string().min(1, "Program ID is required").optional(),
      courseId: z.string().min(1, "Course ID is required").optional(),
      year: z.number().int().min(1, "Year must be at least 1").optional(),
      semester: z
        .number()
        .int()
        .min(1, "Semester must be at least 1")
        .optional(),
    })
    .refine(
      (body) =>
        body.programId !== undefined ||
        body.courseId !== undefined ||
        body.year !== undefined ||
        body.semester !== undefined,
      { message: "At least one field must be provided" },
    ),
});

export const curriculumCourseIdValidation = z.object({
  params: z.object({
    id: z.string().min(1, "Curriculum course ID is required"),
  }),
});

export const curriculumCoursesQueryValidation = z.object({
  query: z.object({
    programId: z.string().min(1).optional(),
    year: z.coerce.number().int().min(1).optional(),
    semester: z.coerce.number().int().min(1).optional(),
  }),
});
