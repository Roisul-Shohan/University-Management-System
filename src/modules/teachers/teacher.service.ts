import AppError from "../../errors/AppErrors.js";
import { prisma } from "../../lib/prisma.js";
import {
  Role,
  TeacherApplicationStatus,
} from "../../../generated/prisma/enums.js";
import { Prisma } from "../../../generated/prisma/client.js";
import type {
  ApplyAsTeacherInput,
  GetTeacherApplicationsQuery,
  RejectTeacherApplicationInput,
  ReviewTeacherApplicationInput,
} from "./teacher.interface.js";
import type {
  GetTeachersQuery,
  UpdateTeacherAdminInput,
} from "./teacher.admin.interface.js";

const getReviewer = async (reviewerId: string) => {
  const reviewer = await prisma.user.findUnique({
    where: { id: reviewerId },
    include: { teacher: true },
  });

  if (!reviewer) throw new AppError(404, "Reviewer user not found.");

  const isSuperAdmin = reviewer.role === Role.SUPER_ADMIN;
  const isDepartmentAdmin =
    reviewer.role === Role.TEACHER && reviewer.teacher?.isDeptAdmin === true;

  if (!isSuperAdmin && !isDepartmentAdmin) {
    throw new AppError(
      403,
      "Only a department admin or super admin can review teacher applications.",
    );
  }

  return { reviewer, isSuperAdmin, isDepartmentAdmin };
};

const ensureDepartmentReviewAccess = async (
  reviewerId: string,
  departmentId: string,
) => {
  const access = await getReviewer(reviewerId);
  if (
    access.isDepartmentAdmin &&
    access.reviewer.teacher?.departmentId !== departmentId
  ) {
    throw new AppError(
      403,
      "Department admins can only review applications for their own department.",
    );
  }
  return access;
};

export const applyAsTeacher = async ({
  userId,
  departmentId,
  joiningYear,
}: ApplyAsTeacherInput) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { teacher: true },
  });

  if (!user) throw new AppError(404, "User not found.");
  if (user.role !== Role.TEACHER) {
    throw new AppError(
      403,
      "Only users registered with the teacher role can apply.",
    );
  }
  if (user.teacher) {
    throw new AppError(409, "This user is already an approved teacher.");
  }

  const department = await prisma.department.findUnique({
    where: { id: departmentId },
  });
  if (!department) throw new AppError(404, "Department not found.");

  const pendingApplication = await prisma.teacherApplication.findFirst({
    where: { userId, status: TeacherApplicationStatus.PENDING },
  });
  if (pendingApplication) {
    throw new AppError(409, "You already have a pending teacher application.");
  }

  return prisma.teacherApplication.create({
    data: {
      userId,
      departmentId,
      joiningYear: joiningYear ?? new Date().getFullYear(),
    },
    include: {
      department: true,
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });
};

export const getMyTeacherApplication = async (userId: string) => {
  return prisma.teacherApplication.findFirst({
    where: { userId },
    include: {
      department: true,
      reviewedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const getMyTeacherProfile = async (userId: string) => {
  const teacher = await prisma.teacher.findUnique({
    where: { id: userId },
    include: { department: true },
  });
  if (!teacher) {
    throw new AppError(404, "You are not an approved teacher yet.");
  }
  return teacher;
};

export const getTeachers = async ({
  departmentId,
  isDeptAdmin,
}: GetTeachersQuery) => {
  return prisma.teacher.findMany({
    where: {
      ...(departmentId ? { departmentId } : {}),
      ...(isDeptAdmin === undefined ? {} : { isDeptAdmin }),
    },
    include: {
      department: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          emailVerified: true,
        },
      },
    },
    orderBy: [{ department: { name: "asc" } }, { teacherId: "asc" }],
  });
};

export const getTeacherById = async (teacherId: string) => {
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    include: {
      department: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          emailVerified: true,
        },
      },
    },
  });

  if (!teacher) throw new AppError(404, "Teacher not found.");
  return teacher;
};

export const updateTeacherAdminStatus = async ({
  teacherId,
  isDeptAdmin,
}: UpdateTeacherAdminInput) => {
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
  });

  if (!teacher) throw new AppError(404, "Teacher not found.");
  if (teacher.isDeptAdmin === isDeptAdmin) {
    throw new AppError(
      409,
      `Teacher is already ${isDeptAdmin ? "a department admin" : "not a department admin"}.`,
    );
  }

  return prisma.teacher.update({
    where: { id: teacherId },
    data: { isDeptAdmin },
    include: { department: true },
  });
};

export const getTeacherApplications = async ({
  reviewerId,
  status,
}: GetTeacherApplicationsQuery) => {
  const access = await getReviewer(reviewerId);
  const departmentId = access.isDepartmentAdmin
    ? access.reviewer.teacher?.departmentId
    : undefined;

  return prisma.teacherApplication.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(departmentId ? { departmentId } : {}),
    },
    include: {
      department: true,
      user: { select: { id: true, name: true, email: true, role: true } },
      reviewedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

const generateTeacherId = async (
  joiningYear: number,
  departmentCode: string,
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
) => {
  const prefix = `T${joiningYear}${departmentCode}`;
  const teachers = await tx.teacher.findMany({
    where: { joiningYear },
    select: { teacherId: true },
  });

  let maxSequence = 0;
  for (const teacher of teachers) {
    if (!teacher.teacherId.startsWith(prefix)) continue;
    const sequence = Number(teacher.teacherId.slice(prefix.length));
    if (Number.isInteger(sequence) && sequence > maxSequence) {
      maxSequence = sequence;
    }
  }

  const nextSequence = maxSequence + 1;
  if (nextSequence > 9999) {
    throw new AppError(409, "Teacher ID sequence limit reached.");
  }

  return `${prefix}${String(nextSequence).padStart(4, "0")}`;
};

export const approveTeacherApplication = async ({
  applicationId,
  reviewerId,
}: ReviewTeacherApplicationInput) => {
  const application = await prisma.teacherApplication.findUnique({
    where: { id: applicationId },
    include: { department: true },
  });
  if (!application) throw new AppError(404, "Teacher application not found.");

  await ensureDepartmentReviewAccess(reviewerId, application.departmentId);
  if (application.status !== TeacherApplicationStatus.PENDING) {
    throw new AppError(409, "Only pending applications can be approved.");
  }

  return prisma.$transaction(
    async (tx) => {
      const currentApplication = await tx.teacherApplication.findUnique({
        where: { id: application.id },
      });
      if (currentApplication?.status !== TeacherApplicationStatus.PENDING) {
        throw new AppError(409, "Only pending applications can be approved.");
      }

      const existingTeacher = await tx.teacher.findUnique({
        where: { id: application.userId },
      });
      if (existingTeacher) {
        throw new AppError(409, "This user is already an approved teacher.");
      }

      const teacherId = await generateTeacherId(
        application.joiningYear,
        application.department.code,
        tx,
      );

      const teacher = await tx.teacher.create({
        data: {
          id: application.userId,
          teacherId,
          joiningYear: application.joiningYear,
          departmentId: application.departmentId,
        },
        include: { department: true },
      });

      await tx.teacherApplication.update({
        where: { id: application.id },
        data: {
          status: TeacherApplicationStatus.APPROVED,
          reviewedById: reviewerId,
          reviewedAt: new Date(),
          rejectionReason: null,
        },
      });

      return teacher;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
};

export const rejectTeacherApplication = async ({
  applicationId,
  reviewerId,
  rejectionReason,
}: RejectTeacherApplicationInput) => {
  const application = await prisma.teacherApplication.findUnique({
    where: { id: applicationId },
  });
  if (!application) throw new AppError(404, "Teacher application not found.");

  await ensureDepartmentReviewAccess(reviewerId, application.departmentId);
  if (application.status !== TeacherApplicationStatus.PENDING) {
    throw new AppError(409, "Only pending applications can be rejected.");
  }

  return prisma.teacherApplication.update({
    where: { id: application.id },
    data: {
      status: TeacherApplicationStatus.REJECTED,
      reviewedById: reviewerId,
      reviewedAt: new Date(),
      rejectionReason: rejectionReason || null,
    },
    include: { department: true },
  });
};
