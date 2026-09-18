import AppError from "../../errors/AppErrors.js";
import { prisma } from "../../lib/prisma.js";
import { Role } from "../../../generated/prisma/enums.js";
import type {
  CreateCourseInput,
  GetCoursesQuery,
  UpdateCourseInput,
} from "./course.interface.js";

const normalizeCode = (code: string) => code.trim().toUpperCase();

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
      "Only the department admin or super admin can manage this course.",
    );
  }
};

const ensureDepartmentExists = async (departmentId: string) => {
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
  });
  if (!department) throw new AppError(404, "Department not found.");
  return department;
};

export const createCourse = async (
  userId: string,
  payload: CreateCourseInput,
) => {
  const code = normalizeCode(payload.code);
  await ensureDepartmentExists(payload.departmentId);
  await ensureDepartmentManager(userId, payload.departmentId);

  const existing = await prisma.course.findUnique({ where: { code } });
  if (existing)
    throw new AppError(409, "A course with this code already exists.");

  return prisma.course.create({
    data: { ...payload, code },
    include: { department: true },
  });
};

export const getCourses = async ({ departmentId }: GetCoursesQuery) => {
  return prisma.course.findMany({
    where: departmentId ? { departmentId } : undefined,
    include: { department: true },
    orderBy: [{ department: { name: "asc" } }, { code: "asc" }],
  });
};

export const getCourseById = async (id: string) => {
  const course = await prisma.course.findUnique({
    where: { id },
    include: { department: true },
  });
  if (!course) throw new AppError(404, "Course not found.");
  return course;
};

export const updateCourse = async (
  userId: string,
  id: string,
  payload: UpdateCourseInput,
) => {
  const existing = await prisma.course.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Course not found.");

  await ensureDepartmentManager(userId, existing.departmentId);

  const data = {
    ...(payload.code === undefined
      ? {}
      : { code: normalizeCode(payload.code) }),
    ...(payload.name === undefined ? {} : { name: payload.name.trim() }),
    ...(payload.credits === undefined ? {} : { credits: payload.credits }),
  };

  if (data.code && data.code !== existing.code) {
    const duplicate = await prisma.course.findUnique({
      where: { code: data.code },
    });
    if (duplicate)
      throw new AppError(409, "A course with this code already exists.");
  }

  return prisma.course.update({
    where: { id },
    data,
    include: { department: true },
  });
};

export const deleteCourse = async (userId: string, id: string) => {
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      curriculumCourses: { select: { id: true }, take: 1 },
      offerings: { select: { id: true }, take: 1 },
      prerequisites: { select: { id: true }, take: 1 },
      prerequisiteFor: { select: { id: true }, take: 1 },
    },
  });
  if (!course) throw new AppError(404, "Course not found.");

  await ensureDepartmentManager(userId, course.departmentId);

  if (course.curriculumCourses.length > 0) {
    throw new AppError(409, "Cannot delete a course used in a curriculum.");
  }
  if (course.offerings.length > 0) {
    throw new AppError(409, "Cannot delete a course with course offerings.");
  }
  if (course.prerequisites.length > 0 || course.prerequisiteFor.length > 0) {
    throw new AppError(409, "Cannot delete a course used in prerequisites.");
  }

  await prisma.course.delete({ where: { id } });
};
