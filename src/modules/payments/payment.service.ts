import AppError from "../../errors/AppErrors.js";
import { prisma } from "../../lib/prisma.js";
import {
	createBkashPayment,
	executeBkashPayment,
	queryBkashPayment,
} from "../../lib/bkash.js";
import {
	AdmissionStatus,
	TransactionStatus,
	TransactionType,
} from "../../../generated/prisma/enums.js";
import {
	CreateAdmissionPaymentParams,
	ExecutePaymentParams,
	GetPaymentStatusParams,
} from "./payment.interface.js";

const ensureAdmissionValidForPayment = (
	admission: {
		userId: string;
		user: { status: string; emailVerified: boolean };
		status: string;
		admissionFee: { lessThanOrEqualTo: (arg0: number) => any };
	},
	userId: string,
) => {
	if (admission.userId !== userId) {
		throw new AppError(
			403,
			"You are not authorized to make payment for this admission.",
		);
	}
	if (admission.user.status !== "ACTIVE") {
		throw new AppError(
			403,
			"Your account is not active. Payment cannot be processed.",
		);
	}
	if (!admission.user.emailVerified) {
		throw new AppError(403, "Please verify your email before making payment.");
	}
	if (admission.status === AdmissionStatus.CONFIRMED) {
		throw new AppError(409, "This admission has already been confirmed.");
	}
	if (admission.status === AdmissionStatus.CANCELLED) {
		throw new AppError(409, "This admission has been cancelled.");
	}
	if (admission.status === AdmissionStatus.REJECTED) {
		throw new AppError(409, "This admission has been rejected.");
	}
	if (admission.status !== AdmissionStatus.PENDING) {
		throw new AppError(409, "This admission is not available for payment.");
	}
};

const ensureAdmissionPeriodOpen = async () => {
	const now = new Date();
	const admissionPeriod = await prisma.academicPeriod.findFirst({
		where: {
			type: "ADMISSION",
			isActive: true,
			startDate: { lte: now },
			endDate: { gte: now },
		},
		orderBy: { startDate: "desc" },
	});

	if (!admissionPeriod) {
		throw new AppError(409, "Admission payment is currently closed.");
	}

	return admissionPeriod;
};

const ensureNoDuplicatePayment = (
	transactions: Array<{ status: string; bkashPaymentId: string | null }>,
) => {
	const successfulTransaction = transactions.find(
		(item) => item.status === TransactionStatus.SUCCESS,
	);

	if (successfulTransaction) {
		throw new AppError(409, "Admission payment has already been completed.");
	}

	const pendingTransaction = transactions.find(
		(item) =>
			item.status === TransactionStatus.PENDING && !!item.bkashPaymentId,
	);

	if (pendingTransaction) {
		throw new AppError(
			409,
			"There is already a pending payment for this admission.",
		);
	}
};

export const createAdmissionPayment = async ({
	admissionId,
	userId,
}: CreateAdmissionPaymentParams) => {
	const admission = await prisma.admission.findUnique({
		where: { id: admissionId },
		include: {
			user: {
				select: {
					id: true,
					email: true,
					status: true,
					emailVerified: true,
				},
			},
		},
	});

	if (!admission) {
		throw new AppError(404, "Admission not found.");
	}

	ensureAdmissionValidForPayment(admission, userId);

	if (admission.admissionFee.lessThanOrEqualTo(0)) {
		throw new AppError(
			400,
			"Invalid admission fee. Payment cannot be processed.",
		);
	}

	await ensureAdmissionPeriodOpen();

	const transaction = await prisma.$transaction(async (tx) => {
		const existingTransactions = await tx.transaction.findMany({
			where: {
				admissionId,
				type: TransactionType.ADMISSION,
			},
			orderBy: { createdAt: "desc" },
		});

		ensureNoDuplicatePayment(existingTransactions);

		return tx.transaction.create({
			data: {
				userId,
				admissionId,
				type: TransactionType.ADMISSION,
				amount: admission.admissionFee,
				status: TransactionStatus.PENDING,
			},
		});
	});

	try {
		const bkashPayment = await createBkashPayment({
			amount: admission.admissionFee.toFixed(2),
			payerReference: admission.user.email,
			merchantInvoiceNumber: transaction.id,
			intent: "sale",
		});

		if (!bkashPayment?.paymentID) {
			await prisma.$transaction(async (tx) => {
				await tx.transaction.update({
					where: { id: transaction.id },
					data: { status: TransactionStatus.FAILED },
				});
			});

			throw new AppError(502, "bKash did not return a payment ID.");
		}

		const updatedTransaction = await prisma.$transaction(async (tx) => {
			return tx.transaction.update({
				where: { id: transaction.id },
				data: { bkashPaymentId: bkashPayment.paymentID },
			});
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
		if (error instanceof AppError) {
			throw error;
		}

		await prisma.$transaction(async (tx) => {
			await tx.transaction.update({
				where: { id: transaction.id },
				data: { status: TransactionStatus.FAILED },
			});
		});

		throw new AppError(
			502,
			"Unable to create bKash payment. Please try again.",
		);
	}
};

const ensureTransactionOwnership = (
	transaction: { userId: string },
	userId: string,
) => {
	if (transaction.userId !== userId) {
		throw new AppError(403, "You are not authorized to execute this payment.");
	}
};

const ensureTransactionExecutable = (transaction: { status: string }) => {
	if (transaction.status === TransactionStatus.SUCCESS) {
		return false;
	}

	if (transaction.status === TransactionStatus.FAILED) {
		throw new AppError(
			409,
			"This payment transaction can no longer be executed.",
		);
	}

	if (transaction.status !== TransactionStatus.PENDING) {
		throw new AppError(
			409,
			"This payment is not in a valid state for execution.",
		);
	}

	return true;
};

const ensureUserActive = (user: { status: string }) => {
	if (user.status !== "ACTIVE") {
		throw new AppError(403, "Your account is not active.");
	}
};

const ensureAdmissionStillPending = (admission: { status: string } | null) => {
	if (!admission) {
		throw new AppError(
			409,
			"Admission information is missing for this transaction.",
		);
	}

	if (admission.status !== AdmissionStatus.PENDING) {
		throw new AppError(409, "This admission is no longer pending.");
	}
};

const validateBkashResult = (
	bkashResult: {
		transactionStatus?: string;
		trxID?: string;
		amount?: string;
	} | null,
	transaction: { amount: unknown },
) => {
	if (!bkashResult) {
		throw new AppError(502, "Invalid response received from bKash.");
	}

	if (bkashResult.transactionStatus !== "Completed") {
		throw new AppError(
			409,
			`bKash payment was not completed. Status: ${bkashResult.transactionStatus ?? "Unknown"}`,
		);
	}

	if (!bkashResult.trxID) {
		throw new AppError(502, "bKash did not return a transaction ID.");
	}

	if (Number(bkashResult.amount) !== Number(String(transaction.amount))) {
		throw new AppError(
			409,
			"Payment amount does not match the transaction amount.",
		);
	}
};

export const executePayment = async ({
	paymentID,
	userId,
}: ExecutePaymentParams) => {
	const transaction = await prisma.transaction.findUnique({
		where: { bkashPaymentId: paymentID },
		include: {
			admission: true,
			user: {
				select: {
					id: true,
					email: true,
					status: true,
				},
			},
		},
	});

	if (!transaction) {
		throw new AppError(404, "Payment transaction not found.");
	}

	ensureTransactionOwnership(transaction, userId);
	ensureUserActive(transaction.user);

	if (!ensureTransactionExecutable(transaction)) {
		return {
			transaction,
			message: "Payment has already been completed.",
		};
	}

	switch (transaction.type) {
		case TransactionType.ADMISSION:
			ensureAdmissionStillPending(transaction.admission);
			break;

		default:
			throw new AppError(400, "This payment type is not supported yet.");
	}

	const bkashResult = await executeBkashPayment(paymentID);
	validateBkashResult(bkashResult, transaction);

	const result = await prisma.$transaction(async (tx) => {
		const currentTransaction = await tx.transaction.findUnique({
			where: { id: transaction.id },
			include: { admission: true },
		});

		if (!currentTransaction) {
			throw new AppError(404, "Payment transaction no longer exists.");
		}

		if (currentTransaction.status === TransactionStatus.SUCCESS) {
			return currentTransaction;
		}

		if (currentTransaction.status !== TransactionStatus.PENDING) {
			throw new AppError(409, "Payment transaction is no longer pending.");
		}

		switch (currentTransaction.type) {
			case TransactionType.ADMISSION: {
				if (!currentTransaction.admission) {
					throw new AppError(409, "Admission information is missing.");
				}

				if (currentTransaction.admission.status !== AdmissionStatus.PENDING) {
					throw new AppError(409, "Admission is no longer pending.");
				}

				const updatedTransaction = await tx.transaction.update({
					where: { id: currentTransaction.id },
					data: {
						status: TransactionStatus.SUCCESS,
						bkashTrxId: bkashResult.trxID,
						paidAt: new Date(),
					},
				});

				await tx.admission.update({
					where: { id: currentTransaction.admission.id },
					data: {
						status: AdmissionStatus.CONFIRMED,
						confirmedAt: new Date(),
					},
				});

				return updatedTransaction;
			}

			default:
				throw new AppError(400, "This payment type is not supported yet.");
		}
	});

	return {
		transaction: result,
		bkash: {
			paymentID,
			trxID: bkashResult.trxID,
			transactionStatus: bkashResult.transactionStatus,
		},
	};
};

export const getPaymentStatus = async ({
	transactionId,
	userId,
}: GetPaymentStatusParams) => {
	const transaction = await prisma.transaction.findUnique({
		where: { id: transactionId },
		include: {
			admission: true,
		},
	});

	if (!transaction) {
		throw new AppError(404, "Payment transaction not found.");
	}

	if (transaction.userId !== userId) {
		throw new AppError(403, "You are not authorized to view this payment.");
	}

	
	if (
		transaction.status === TransactionStatus.SUCCESS ||
		transaction.status === TransactionStatus.FAILED
	) {
		return {
			transaction,
			bkash: transaction.bkashPaymentId
				? {
						paymentID: transaction.bkashPaymentId,
						trxID: transaction.bkashTrxId,
					}
				: null,
		};
	}

	if (!transaction.bkashPaymentId) {
		return {
			transaction,
			bkash: null,
		};
	}

	const bkashResult = await queryBkashPayment(transaction.bkashPaymentId);

	if (!bkashResult) {
		throw new AppError(502, "Invalid response received from bKash.");
	}

	
	if (bkashResult.transactionStatus !== "Completed") {
		return {
			transaction,
			bkash: {
				paymentID: transaction.bkashPaymentId,
				trxID: bkashResult.trxID ?? null,
				transactionStatus: bkashResult.transactionStatus ?? "Unknown",
			},
		};
	}

	if (!bkashResult.trxID) {
		throw new AppError(502, "bKash did not return a transaction ID.");
	}

	
	const result = await prisma.$transaction(async (tx) => {
		const currentTransaction = await tx.transaction.findUnique({
			where: { id: transaction.id },
			include: {
				admission: true,
			},
		});

		if (!currentTransaction) {
			throw new AppError(404, "Payment transaction no longer exists.");
		}

		if (currentTransaction.status === TransactionStatus.SUCCESS) {
			return currentTransaction;
		}

		if (currentTransaction.status !== TransactionStatus.PENDING) {
			throw new AppError(409, "Payment transaction is no longer pending.");
		}

		const updatedTransaction = await tx.transaction.update({
			where: { id: currentTransaction.id },
			data: {
				status: TransactionStatus.SUCCESS,
				bkashTrxId: bkashResult.trxID,
				paidAt: new Date(),
			},
			include: {
				admission: true,
			},
		});

		
		switch (currentTransaction.type) {
			case TransactionType.ADMISSION:
				if (!currentTransaction.admission) {
					throw new AppError(
						409,
						"Admission information is missing for this transaction.",
					);
				}

				if (currentTransaction.admission.status === AdmissionStatus.PENDING) {
					await tx.admission.update({
						where: {
							id: currentTransaction.admission.id,
						},
						data: {
							status: AdmissionStatus.CONFIRMED,
							confirmedAt: new Date(),
						},
					});
				}

				break;

			default:
				break;
		}

		return updatedTransaction;
	});

	return {
		transaction: result,
		bkash: {
			paymentID: transaction.bkashPaymentId,
			trxID: bkashResult.trxID,
			transactionStatus: bkashResult.transactionStatus,
		},
	};
};
