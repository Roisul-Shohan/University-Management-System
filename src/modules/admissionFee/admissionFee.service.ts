import AppError from "../../errors/AppErrors.js";
import { prisma } from "../../lib/prisma.js";
import type {
  ICreateAdmissionFee,
  IUpdateAdmissionFee,
} from "./admissionFee.interface.js";

export const createAdmissionFee = async (payload: ICreateAdmissionFee) => {
  const programExists = await prisma.program.findUnique({
    where: { id: payload.programId },
  });

  if (!programExists) {
    throw new AppError(404, "Program not found.");
  }

  if (payload.isActive !== false) {
    const existingFee = await prisma.admissionFee.findFirst({
      where: { programId: payload.programId, isActive: true },
    });

    if (existingFee) {
      throw new AppError(
        409,
        "An active admission fee already exists for this program.",
      );
    }
  }

  return prisma.admissionFee.create({ data: payload });
};

export const getAllAdmissionFees = async () =>
  prisma.admissionFee.findMany({
    include: { program: true },
    orderBy: { createdAt: "desc" },
  });

export const getAdmissionFeeById = async (id: string) => {
  const fee = await prisma.admissionFee.findUnique({
    where: { id },
    include: { program: true },
  });

  if (!fee) {
    throw new AppError(404, "Admission fee not found.");
  }

  return fee;
};

export const updateAdmissionFee = async (
  id: string,
  payload: IUpdateAdmissionFee,
) => {
  const existing = await prisma.admissionFee.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, "Admission fee not found.");
  }

  if (payload.isActive === true && !existing.isActive) {
    const active = await prisma.admissionFee.findFirst({
      where: {
        programId: existing.programId,
        isActive: true,
        NOT: { id },
      },
    });

    if (active) {
      throw new AppError(
        409,
        "There is already an active admission fee for this program.",
      );
    }
  }

  return prisma.admissionFee.update({ where: { id }, data: payload });
};

export const deleteAdmissionFee = async (id: string) => {
  const existing = await prisma.admissionFee.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, "Admission fee not found.");
  }

  return prisma.admissionFee.delete({ where: { id } });
};
