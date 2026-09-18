import AppError from "../../errors/AppErrors.js";
import { prisma } from "../../lib/prisma.js";
import { ICreateSemesterFee, IUpdateSemesterFee } from "./semesterFee.interface.js";

export const createSemesterFee = async (payload: ICreateSemesterFee) => {
    const programExists = await prisma.program.findUnique({
        where: { id: payload.programId }
    });

    if (!programExists) {
        throw new AppError(404, "Program not found.");
    }

    const existingFee = await prisma.semesterFee.findFirst({
        where: {
            programId: payload.programId,
            isActive: true
        }
    });

    if (existingFee) {
        throw new AppError(409, "An active semester fee already exists for this program.");
    }

    return prisma.semesterFee.create({
        data: payload,
    });
};

export const getAllSemesterFees = async () => {
    return prisma.semesterFee.findMany({
        include: { program: true },
        orderBy: { createdAt: 'desc' }
    });
};

export const updateSemesterFee = async (id: string, payload: IUpdateSemesterFee) => {
    const existing = await prisma.semesterFee.findUnique({ where: { id } });
    if (!existing) {
        throw new AppError(404, "Semester fee not found");
    }

    // Only allow one active fee per program if activating
    if (payload.isActive && !existing.isActive) {
        const active = await prisma.semesterFee.findFirst({
            where: {
                programId: existing.programId,
                isActive: true,
            }
        });
        if (active) {
            throw new AppError(409, "There is already an active semester fee for this program.");
        }
    }

    return prisma.semesterFee.update({
        where: { id },
        data: payload,
    });
};

export const deleteSemesterFee = async (id: string) => {
    return prisma.semesterFee.delete({
        where: { id }
    });
};
