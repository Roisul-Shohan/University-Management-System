import { z } from "zod";

const academicPeriodDate = z.preprocess((value) => {
  if (typeof value === "string") {
    const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value);

    if (match) {
      const [, day, month, year] = match;
      return `${year}-${month}-${day}T00:00:00.000Z`;
    }
  }

  return value;
}, z.coerce.date());

export const createAcademicPeriodSchema = z
  .object({
    body: z.object({
      type: z.enum([
        "ADMISSION",
        "SEMESTER_REGISTRATION",
        "COURSE_REGISTRATION",
        "MIDTERM_EXAM",
        "FINAL_EXAM",
        "RESULT_PUBLICATION",
      ]),

      startDate: academicPeriodDate,

      endDate: academicPeriodDate,
    }),
  })
  .refine((data) => data.body.startDate < data.body.endDate, {
    message: "Start date must be before end date.",
    path: ["body", "startDate"],
  });

export const getAcademicPeriodsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(10),

    type: z
      .enum([
        "ADMISSION",
        "SEMESTER_REGISTRATION",
        "COURSE_REGISTRATION",
        "MIDTERM_EXAM",
        "FINAL_EXAM",
        "RESULT_PUBLICATION",
      ])
      .optional(),

    isActive: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional(),

    sortBy: z.enum(["startDate", "endDate", "createdAt"]).default("startDate"),

    sortOrder: z.enum(["asc", "desc"]).default("asc"),
  }),
});

export const getAcademicPeriodByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid academic period ID."),
  }),
});

export const updateAcademicPeriodSchema = z
  .object({
    type: z
      .enum([
        "ADMISSION",
        "SEMESTER_REGISTRATION",
        "COURSE_REGISTRATION",
        "MIDTERM_EXAM",
        "FINAL_EXAM",
        "RESULT_PUBLICATION",
      ])
      .optional(),

    startDate: academicPeriodDate.optional(),

    endDate: academicPeriodDate.optional(),
  })
  .refine(
    (data) =>
      data.type !== undefined ||
      data.startDate !== undefined ||
      data.endDate !== undefined,
    {
      message: "At least one field must be provided.",
    },
  )
  .refine(
    (data) =>
      data.startDate === undefined ||
      data.endDate === undefined ||
      data.startDate < data.endDate,
    {
      message: "Start date must be before end date.",
      path: ["startDate"],
    },
  );

export const updateAcademicPeriodRequestSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid academic period ID."),
  }),

  body: updateAcademicPeriodSchema,
});

export const updateAcademicPeriodStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid academic period ID."),
  }),

  body: z.object({
    isActive: z.boolean(),
  }),
});
