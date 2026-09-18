import AppError from "../../errors/AppErrors.js";
import { prisma } from "../../lib/prisma.js";
import type {
  ICreateCreditFee,
  IUpdateCreditFee,
} from "./creditFee.interface.js";

export const createCreditFee = async (payload: ICreateCreditFee) => {
  const programExists = await prisma.program.findUnique({
    where: { id: payload.programId },
  });

  if (!programExists) {
    throw new AppError(404, "Program not found.");
  }

  const existingFee = await prisma.creditFee.findFirst({
    where: {
      programId: payload.programId,
      isActive: true,
    },
  });

  if (existingFee) {
    throw new AppError(
      409,
      "An active per-credit fee already exists for this program.",
    );
  }

  return prisma.creditFee.create({ data: payload });
};

export const getAllCreditFees = async () => {
  return prisma.creditFee.findMany({
    include: { program: true },
    orderBy: { createdAt: "desc" },
  });
};

export const getCreditFeeById = async (id: string) => {
  const fee = await prisma.creditFee.findUnique({
    where: { id },
    include: { program: true },
  });
  if (!fee) {
    throw new AppError(404, "Credit fee not found.");
  }
  return fee;
};

export const updateCreditFee = async (
  id: string,
  payload: IUpdateCreditFee,
) => {
  const existing = await prisma.creditFee.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, "Credit fee not found.");
  }

  if (payload.isActive && !existing.isActive) {
    const active = await prisma.creditFee.findFirst({
      where: {
        programId: existing.programId,
        isActive: true,
      },
    });
    if (active) {
      throw new AppError(
        409,
        "There is already an active credit fee for this program.",
      );
    }
  }

  return prisma.creditFee.update({
    where: { id },
    data: payload,
  });
};

export const deleteCreditFee = async (id: string) => {
  const existing = await prisma.creditFee.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, "Credit fee not found.");
  }

  return prisma.creditFee.delete({
    where: { id },
  });
};
