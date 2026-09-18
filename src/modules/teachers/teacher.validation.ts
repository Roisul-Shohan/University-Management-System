import { z } from "zod";

export const applyTeacherValidation = z.object({
  body: z.object({
    departmentId: z.string().min(1, "Department ID is required"),
    joiningYear: z.number().int().min(2000).max(3000).optional(),
  }),
});

export const teacherApplicationIdValidation = z.object({
  params: z.object({
    id: z.string().min(1, "Application ID is required"),
  }),
});

export const teacherIdValidation = z.object({
  params: z.object({
    id: z.string().min(1, "Teacher ID is required"),
  }),
});

export const teachersQueryValidation = z.object({
  query: z.object({
    departmentId: z.string().min(1).optional(),
    isDeptAdmin: z.enum(["true", "false"]).optional(),
  }),
});

export const updateTeacherAdminValidation = z.object({
  params: z.object({
    id: z.string().min(1, "Teacher ID is required"),
  }),
  body: z.object({
    isDeptAdmin: z.boolean({ message: "isDeptAdmin must be a boolean" }),
  }),
});

export const teacherApplicationsQueryValidation = z.object({
  query: z.object({
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  }),
});

export const rejectTeacherApplicationValidation = z.object({
  params: z.object({
    id: z.string().min(1, "Application ID is required"),
  }),
  body: z.object({
    rejectionReason: z.string().trim().max(500).optional(),
  }),
});
