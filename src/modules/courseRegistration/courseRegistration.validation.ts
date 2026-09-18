import { z } from "zod";

export const studentSemesterParamsValidation = z.object({
  params: z.object({
    studentSemesterId: z.string().min(1, "Student semester ID is required"),
  }),
});

export const registerCourseValidation = z.object({
  params: z.object({
    studentSemesterId: z.string().min(1, "Student semester ID is required"),
  }),
  body: z.object({
    courseOfferingId: z.string().min(1, "Course offering ID is required"),
  }),
});
