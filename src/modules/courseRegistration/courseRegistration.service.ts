import AppError from "../../errors/AppErrors.js";
import { prisma } from "../../lib/prisma.js";
import {
  EnrollmentStatus,
  StudentSemesterStatus,
} from "../../../generated/prisma/enums.js";
import {
  CourseRegistrationParams,
  RegisterCourseParams,
} from "./courseRegistration.interface.js";

const ensureRegistrationPeriod = async () => {
  const now = new Date();
  const period = await prisma.academicPeriod.findFirst({
    where: {
      type: "COURSE_REGISTRATION",
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
    },
  });

  if (!period) {
    throw new AppError(409, "Course registration is currently closed.");
  }
};

const getOwnedSemester = async ({
  studentSemesterId,
  userId,
}: CourseRegistrationParams) => {
  const studentSemester = await prisma.studentSemester.findUnique({
    where: { id: studentSemesterId },
    include: { student: true },
  });

  if (!studentSemester) throw new AppError(404, "Student semester not found.");
  if (studentSemester.studentId !== userId) {
    throw new AppError(403, "You are not authorized to manage this semester.");
  }
  if (studentSemester.status !== StudentSemesterStatus.REGISTERED) {
    throw new AppError(409, "Semester registration must be completed first.");
  }

  return studentSemester;
};

export const getAvailableCourseOfferings = async (
  params: CourseRegistrationParams,
) => {
  const studentSemester = await getOwnedSemester(params);
  await ensureRegistrationPeriod();

  return prisma.courseOffering.findMany({
    where: {
      year: studentSemester.year,
      semester: studentSemester.semester,
      course: {
        curriculumCourses: {
          some: {
            programId: studentSemester.student.programId,
            year: studentSemester.year,
            semester: studentSemester.semester,
          },
        },
      },
    },
    include: {
      course: true,
      teacher: true,
      _count: { select: { enrollments: true } },
    },
    orderBy: { course: { code: "asc" } },
  });
};

export const registerCourse = async ({
  studentSemesterId,
  userId,
  courseOfferingId,
}: RegisterCourseParams) => {
  const studentSemester = await getOwnedSemester({ studentSemesterId, userId });
  await ensureRegistrationPeriod();

  const offering = await prisma.courseOffering.findUnique({
    where: { id: courseOfferingId },
    include: {
      course: {
        include: {
          curriculumCourses: {
            where: {
              programId: studentSemester.student.programId,
              year: studentSemester.year,
              semester: studentSemester.semester,
            },
          },
        },
      },
      enrollments: {
        where: {
          status: { in: [EnrollmentStatus.PENDING, EnrollmentStatus.ENROLLED] },
        },
        select: { id: true },
      },
    },
  });

  if (
    !offering ||
    offering.year !== studentSemester.year ||
    offering.semester !== studentSemester.semester
  ) {
    throw new AppError(
      404,
      "Course offering is not available for this semester.",
    );
  }
  if (offering.course.curriculumCourses.length === 0) {
    throw new AppError(
      409,
      "This course is not part of your program curriculum for this term.",
    );
  }
  if (
    offering.capacity !== null &&
    offering.enrollments.length >= offering.capacity
  ) {
    throw new AppError(409, "This course offering is full.");
  }

  const existing = await prisma.courseEnrollment.findUnique({
    where: {
      studentSemesterId_courseOfferingId: {
        studentSemesterId,
        courseOfferingId,
      },
    },
  });
  if (existing?.status === EnrollmentStatus.ENROLLED) {
    throw new AppError(409, "You are already enrolled in this course.");
  }
  if (existing) {
    return prisma.courseEnrollment.update({
      where: { id: existing.id },
      data: { status: EnrollmentStatus.PENDING, droppedAt: null },
      include: { courseOffering: { include: { course: true } } },
    });
  }

  return prisma.courseEnrollment.create({
    data: {
      studentSemesterId,
      courseOfferingId,
      status: EnrollmentStatus.PENDING,
    },
    include: { courseOffering: { include: { course: true } } },
  });
};

export const dropCourse = async ({
  studentSemesterId,
  userId,
  courseOfferingId,
}: RegisterCourseParams) => {
  await getOwnedSemester({ studentSemesterId, userId });
  await ensureRegistrationPeriod();

  const enrollment = await prisma.courseEnrollment.findUnique({
    where: {
      studentSemesterId_courseOfferingId: {
        studentSemesterId,
        courseOfferingId,
      },
    },
  });
  if (!enrollment) throw new AppError(404, "Course enrollment not found.");
  if (enrollment.status !== EnrollmentStatus.PENDING) {
    throw new AppError(
      409,
      "Paid course enrollments cannot be dropped during registration.",
    );
  }

  return prisma.courseEnrollment.update({
    where: { id: enrollment.id },
    data: { status: EnrollmentStatus.DROPPED, droppedAt: new Date() },
  });
};
