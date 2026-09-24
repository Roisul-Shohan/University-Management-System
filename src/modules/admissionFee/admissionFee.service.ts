import AppError from "../../errors/AppErrors.js";
import { prisma } from "../../lib/prisma.js";
import type {
  ICreateAdmissionFee,
  IUpdateAdmissionFee,
} from "./admissionFee.interface.js";

export const createAdmissionFee = async (payload: ICreateAdmissionFee) => {
  return prisma.$transaction(
    async (tx) => {
      const programExists = await tx.program.findUnique({
        where: { id: payload.programId },
      });

      if (!programExists) {
        throw new AppError(404, "Program not found.");
      }

      if (payload.isActive !== false) {
        const existingFee = await tx.admissionFee.findFirst({
          where: { programId: payload.programId, isActive: true },
        });

        if (existingFee) {
          throw new AppError(
            409,
            "An active admission fee already exists for this program.",
          );
        }
      }

      return tx.admissionFee.create({ data: payload });
    },
    { isolationLevel: "Serializable" },
  );
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
  return prisma.$transaction(
    async (tx) => {
      const existing = await tx.admissionFee.findUnique({ where: { id } });
      if (!existing) {
        throw new AppError(404, "Admission fee not found.");
      }

      if (payload.isActive === true && !existing.isActive) {
        const active = await tx.admissionFee.findFirst({
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

      return tx.admissionFee.update({ where: { id }, data: payload });
    },
    { isolationLevel: "Serializable" },
  );
};

export const deleteAdmissionFee = async (id: string) => {
  const existing = await prisma.admissionFee.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, "Admission fee not found.");
  }

  return prisma.admissionFee.delete({ where: { id } });
};
