import AppError from "../../errors/AppErrors.js";
import { prisma } from "../../lib/prisma.js";
import { createBkashPayment } from "../../lib/bkash.js";
import { TransactionStatus, TransactionType, StudentSemesterStatus } from "../../../generated/prisma/enums.js";
import { IInitiateSemesterPayment } from "./studentSemester.interface.js";

export const initiateSemesterPayment = async ({
    studentSemesterId,
    userId,
}: IInitiateSemesterPayment) => {
    const studentSemester = await prisma.studentSemester.findUnique({
        where: { id: studentSemesterId },
        include: {
            student: {
                include: {
                    program: {
                        include: {
                            semesterFees: {
                                where: { isActive: true },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!studentSemester) {
        throw new AppError(404, "Student Semester not found.");
    }

    if (studentSemester.student.id !== userId) {
        throw new AppError(403, "You are not authorized to make a payment for this semester.");
    }

    if (studentSemester.status !== StudentSemesterStatus.PENDING) {
        throw new AppError(409, `Cannot initiate payment. Semester status is ${studentSemester.status}.`);
    }

    const now = new Date();
    const registrationPeriod = await prisma.academicPeriod.findFirst({
        where: {
            type: "SEMESTER_REGISTRATION",
            isActive: true,
            startDate: { lte: now },
            endDate: { gte: now },
        },
    });

    if (!registrationPeriod) {
        throw new AppError(409, "Semester registration is currently closed.");
    }

    const activeFee = studentSemester.student.program.semesterFees[0];
    if (!activeFee) {
        throw new AppError(404, "No active semester fee found for your program.");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.email) {
        throw new AppError(404, "User email not found.");
    }

    const feeAmount = activeFee.amount;

    const transaction = await prisma.$transaction(async (tx) => {
        const existingSuccessful = await tx.transaction.findFirst({
            where: {
                studentSemesterId,
                type: TransactionType.SEMESTER_REGISTRATION,
                status: TransactionStatus.SUCCESS,
            },
        });

        if (existingSuccessful) {
            throw new AppError(409, "Semester registration payment has already been completed.");
        }

        const existingPending = await tx.transaction.findFirst({
            where: {
                studentSemesterId,
                type: TransactionType.SEMESTER_REGISTRATION,
                status: TransactionStatus.PENDING,
                bkashPaymentId: { not: null },
            },
        });

        if (existingPending) {
            throw new AppError(409, "There is already a pending payment for this semester.");
        }

        return tx.transaction.create({
            data: {
                userId,
                studentId: studentSemester.studentId,
                studentSemesterId,
                type: TransactionType.SEMESTER_REGISTRATION,
                amount: feeAmount,
                status: TransactionStatus.PENDING,
            },
        });
    });

    try {
        const bkashPayment = await createBkashPayment({
            amount: feeAmount.toFixed(2),
            payerReference: user.email,
            merchantInvoiceNumber: transaction.id,
            intent: "sale",
        });

        if (!bkashPayment?.paymentID) {
            await prisma.transaction.update({
                where: { id: transaction.id },
                data: { status: TransactionStatus.FAILED },
            });
            throw new AppError(502, "bKash did not return a payment ID.");
        }

        const updatedTransaction = await prisma.transaction.update({
            where: { id: transaction.id },
            data: { bkashPaymentId: bkashPayment.paymentID },
        });

        return {
            transaction: updatedTransaction,
            bkash: {
                paymentID: bkashPayment.paymentID,
                bkashURL: bkashPayment.bkashURL,
                transactionStatus: bkashPayment.transactionStatus,
            },
        };
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError(502, "Unable to create bKash payment. Please try again.");
    }
};
