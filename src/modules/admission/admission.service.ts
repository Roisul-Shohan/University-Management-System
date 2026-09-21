/** biome-ignore-all lint/style/useImportType: <explanation> */
/** biome-ignore-all assist/source/organizeImports: <explanation> */
import AppError from "../../errors/AppErrors.js";
import { prisma } from "../../lib/prisma.js";
import {
  AdmissionStatus,
  Role,
  TransactionType,
} from "../../../generated/prisma/enums.js";
import {
  CreateAdmissionParams,
  ReviewAdmissionParams,
} from "./admission.interface.js";

export const createAdmission = async ({
  userId,
  programId,
  admissionYear,
}: CreateAdmissionParams) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      status: true,
      emailVerified: true,
      role: true,
    },
  });

  if (!user) {
    throw new AppError(404, "User not found.");
  }

  if (user.role !== Role.STUDENT) {
    throw new AppError(403, "Only students can apply for admission.");
  }

  if (user.status !== "ACTIVE") {
    throw new AppError(403, "Your account is not active.");
  }

  if (!user.emailVerified) {
    throw new AppError(
      403,
      "Please verify your email before applying for admission.",
    );
  }

  const now = new Date();

  const admissionPeriod = await prisma.academicPeriod.findFirst({
    where: {
      type: "ADMISSION",
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    orderBy: {
      startDate: "desc",
    },
  });

  if (!admissionPeriod) {
    throw new AppError(409, "Admission application is currently closed.");
  }

  const admissionFee = await prisma.admissionFee.findFirst({
    where: {
      programId,
      isActive: true,
    },
  });

  if (!admissionFee) {
    throw new AppError(404, "Admission fee not found for this program.");
  }

  if (Number(admissionFee.amount) <= 0) {
    throw new AppError(400, "Invalid admission fee for this program.");
  }

  const existingAdmission = await prisma.admission.findFirst({
    where: {
      userId,
      programId,
      admissionYear,
      status: {
        in: [
          AdmissionStatus.PENDING,
          AdmissionStatus.APPROVED,
          AdmissionStatus.CONFIRMED,
        ],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (existingAdmission) {
    throw new AppError(
      409,
      "You already have an active admission application for this program.",
    );
  }

  const admission = await prisma.admission.create({
    data: {
      userId,
      programId,
      admissionYear,
      admissionFee: admissionFee.amount,
      status: AdmissionStatus.PENDING,
    },
  });

  return admission;
};

export const approveAdmission = async ({
  admissionId,
  userId,
}: ReviewAdmissionParams) => {
  const admission = await prisma.admission.findUnique({
    where: { id: admissionId },
    include: {
      program: {
        include: {
          department: true,
        },
      },
    },
  });

  if (!admission) {
    throw new AppError(404, "Admission not found.");
  }

  if (admission.status !== AdmissionStatus.PENDING) {
    throw new AppError(409, "Only pending admissions can be approved.");
  }

  const reviewer = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      teacher: {
        select: {
          isDeptAdmin: true,
          departmentId: true,
        },
      },
    },
  });

  if (!reviewer) {
    throw new AppError(404, "Reviewer not found.");
  }

  const isSuperAdmin = reviewer.role === Role.SUPER_ADMIN;
  const isDeptAdmin =
    reviewer.role === Role.TEACHER && reviewer.teacher?.isDeptAdmin === true;

  if (!isSuperAdmin && !isDeptAdmin) {
    throw new AppError(
      403,
      "Only a super admin or department admin can approve admissions.",
    );
  }

  if (
    isDeptAdmin &&
    reviewer.teacher?.departmentId !== admission.program.departmentId
  ) {
    throw new AppError(
      403,
      "You can only approve admissions for your department.",
    );
  }

  return prisma.admission.update({
    where: { id: admissionId },
    data: {
      status: AdmissionStatus.APPROVED,
    },
  });
};

export const rejectAdmission = async ({
  admissionId,
  userId,
}: ReviewAdmissionParams) => {
  const admission = await prisma.admission.findUnique({
    where: { id: admissionId },
    include: {
      program: {
        include: {
          department: true,
        },
      },
    },
  });

  if (!admission) {
    throw new AppError(404, "Admission not found.");
  }

  if (admission.status !== AdmissionStatus.PENDING) {
    throw new AppError(409, "Only pending admissions can be rejected.");
  }

  const reviewer = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      teacher: {
        select: {
          isDeptAdmin: true,
          departmentId: true,
        },
      },
    },
  });

  if (!reviewer) {
    throw new AppError(404, "Reviewer not found.");
  }

  const isSuperAdmin = reviewer.role === Role.SUPER_ADMIN;
  const isDeptAdmin =
    reviewer.role === Role.TEACHER && reviewer.teacher?.isDeptAdmin === true;

  if (!isSuperAdmin && !isDeptAdmin) {
    throw new AppError(
      403,
      "Only a super admin or department admin can reject admissions.",
    );
  }

  if (
    isDeptAdmin &&
    reviewer.teacher?.departmentId !== admission.program.departmentId
  ) {
    throw new AppError(
      403,
      "You can only reject admissions for your department.",
    );
  }

  return prisma.admission.update({
    where: { id: admissionId },
    data: {
      status: AdmissionStatus.REJECTED,
    },
  });
};

export const getMyAdmissions = async (userId: string) => {
  const admissions = await prisma.admission.findMany({
    where: {
      userId,
    },
    include: {
      program: {
        select: {
          id: true,
          degreeType: true,
          departmentId: true,
          department: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      transactions: {
        where: {
          type: TransactionType.ADMISSION,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          amount: true,
          status: true,
          bkashPaymentId: true,
          bkashTrxId: true,
          paidAt: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return admissions;
};

export const getAdmissionById = async ({
  admissionId,
  userId,
}: {
  admissionId: string;
  userId: string;
}) => {
  const admission = await prisma.admission.findUnique({
    where: {
      id: admissionId,
    },
    include: {
      program: {
        select: {
          id: true,
          degreeType: true,
          departmentId: true,
          department: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      transactions: {
        where: {
          type: TransactionType.ADMISSION,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          amount: true,
          status: true,
          bkashPaymentId: true,
          bkashTrxId: true,
          paidAt: true,
          createdAt: true,
        },
      },
    },
  });

  if (!admission) {
    throw new AppError(404, "Admission not found.");
  }

  const requester = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      role: true,
      teacher: {
        select: {
          isDeptAdmin: true,
          departmentId: true,
        },
      },
    },
  });

  if (!requester) {
    throw new AppError(404, "User not found.");
  }

  if (requester.role === Role.SUPER_ADMIN) {
    return admission;
  }

  if (requester.role === Role.STUDENT) {
    if (admission.userId !== userId) {
      throw new AppError(403, "You are not authorized to view this admission.");
    }

    return admission;
  }

  if (requester.role === Role.TEACHER && requester.teacher?.isDeptAdmin) {
    if (requester.teacher.departmentId !== admission.program.departmentId) {
      throw new AppError(
        403,
        "You can only view admissions from your department.",
      );
    }

    return admission;
  }

  throw new AppError(403, "You are not authorized to view this admission.");
};

export const getAdmissions = async ({
  userId,
  status,
  admissionYear,
  programId,
}: {
  userId: string;
  status?: AdmissionStatus;
  admissionYear?: number;
  programId?: string;
}) => {
  const requester = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      role: true,
      teacher: {
        select: {
          isDeptAdmin: true,
          departmentId: true,
        },
      },
    },
  });

  if (!requester) {
    throw new AppError(404, "User not found.");
  }

  const where: any = {};

  if (status) {
    where.status = status;
  }

  if (admissionYear) {
    where.admissionYear = admissionYear;
  }

  if (programId) {
    where.programId = programId;
  }

  if (requester.role === Role.SUPER_ADMIN) {
    // Super admin can see all admissions.
  } else if (
    requester.role === Role.TEACHER &&
    requester.teacher?.isDeptAdmin
  ) {
    where.program = {
      departmentId: requester.teacher.departmentId,
    };
  } else {
    throw new AppError(
      403,
      "Only a super admin or department admin can view all admissions.",
    );
  }

  const admissions = await prisma.admission.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
        },
      },
      program: {
        select: {
          id: true,
          degreeType: true,
          departmentId: true,
          department: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return admissions;
};
