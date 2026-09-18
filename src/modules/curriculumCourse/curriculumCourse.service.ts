import { Role } from "../../../generated/prisma/enums.js";
import AppError from "../../errors/AppErrors.js";
import { prisma } from "../../lib/prisma.js";
import type {
  CreateCurriculumCourseInput,
  GetCurriculumCoursesQuery,
  UpdateCurriculumCourseInput,
} from "./curriculumCourse.interface.js";

const ensureDepartmentManager = async (
  userId: string,
  departmentId: string,
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { teacher: true },
  });

  if (!user) throw new AppError(404, "User not found.");

  const isSuperAdmin = user.role === Role.SUPER_ADMIN;
  const isDepartmentAdmin =
    user.role === Role.TEACHER &&
    user.teacher?.isDeptAdmin === true &&
    user.teacher.departmentId === departmentId;

  if (!isSuperAdmin && !isDepartmentAdmin) {
    throw new AppError(
      403,
      "Only the department admin or super admin can manage this curriculum course.",
    );
  }
};

const ensureProgramExists = async (programId: string) => {
  const program = await prisma.program.findUnique({
    where: { id: programId },
    include: { department: true },
  });

  if (!program) throw new AppError(404, "Program not found.");
  return program;
};

const ensureCourseExists = async (courseId: string) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { department: true },
  });

  if (!course) throw new AppError(404, "Course not found.");
  return course;
};

const getCurriculumCourse = async (id: string) => {
  const curriculumCourse = await prisma.curriculumCourse.findUnique({
    where: { id },
    include: {
      program: { include: { department: true } },
      course: { include: { department: true } },
    },
  });

  if (!curriculumCourse)
    throw new AppError(404, "Curriculum course not found.");
  return curriculumCourse;
};

export const createCurriculumCourse = async (
  userId: string,
  payload: CreateCurriculumCourseInput,
) => {
  const program = await ensureProgramExists(payload.programId);
  const course = await ensureCourseExists(payload.courseId);

  if (program.departmentId !== course.departmentId) {
    throw new AppError(
      400,
      "The selected course must belong to the same department as the program.",
    );
  }

  await ensureDepartmentManager(userId, program.departmentId);

  const existing = await prisma.curriculumCourse.findUnique({
    where: {
      programId_courseId: {
        programId: payload.programId,
        courseId: payload.courseId,
      },
    },
  });

  if (existing) {
    throw new AppError(
      409,
      "This course is already assigned to the selected program.",
    );
  }

  return prisma.curriculumCourse.create({
    data: {
      programId: payload.programId,
      courseId: payload.courseId,
      year: payload.year,
      semester: payload.semester,
    },
    include: {
      program: { include: { department: true } },
      course: { include: { department: true } },
    },
  });
};

export const getCurriculumCourses = async ({
  programId,
  year,
  semester,
}: GetCurriculumCoursesQuery) => {
  return prisma.curriculumCourse.findMany({
    where: {
      ...(programId ? { programId } : {}),
      ...(year !== undefined ? { year } : {}),
      ...(semester !== undefined ? { semester } : {}),
    },
    include: {
      program: { include: { department: true } },
      course: { include: { department: true } },
    },
    orderBy: [
      { program: { department: { name: "asc" } } },
      { year: "asc" },
      { semester: "asc" },
      { course: { code: "asc" } },
    ],
  });
};

export const getCurriculumCourseById = async (id: string) => {
  return getCurriculumCourse(id);
};

export const updateCurriculumCourse = async (
  userId: string,
  id: string,
  payload: UpdateCurriculumCourseInput,
) => {
  const existing = await getCurriculumCourse(id);
  await ensureDepartmentManager(userId, existing.program.departmentId);

  const programId = payload.programId ?? existing.programId;
  const courseId = payload.courseId ?? existing.courseId;
  const program =
    payload.programId !== undefined
      ? await ensureProgramExists(payload.programId)
      : existing.program;
  const course =
    payload.courseId !== undefined
      ? await ensureCourseExists(payload.courseId)
      : existing.course;

  if (program.departmentId !== course.departmentId) {
    throw new AppError(
      400,
      "The selected course must belong to the same department as the program.",
    );
  }

  const duplicate = await prisma.curriculumCourse.findUnique({
    where: {
      programId_courseId: {
        programId,
        courseId,
      },
    },
  });

  if (duplicate && duplicate.id !== id) {
    throw new AppError(
      409,
      "This course is already assigned to the selected program.",
    );
  }

  return prisma.curriculumCourse.update({
    where: { id },
    data: {
      ...(payload.programId !== undefined ? { programId } : {}),
      ...(payload.courseId !== undefined ? { courseId } : {}),
      ...(payload.year !== undefined ? { year: payload.year } : {}),
      ...(payload.semester !== undefined ? { semester: payload.semester } : {}),
    },
    include: {
      program: { include: { department: true } },
      course: { include: { department: true } },
    },
  });
};

export const deleteCurriculumCourse = async (userId: string, id: string) => {
  const curriculumCourse = await getCurriculumCourse(id);
  await ensureDepartmentManager(userId, curriculumCourse.program.departmentId);

  await prisma.curriculumCourse.delete({ where: { id } });
};
