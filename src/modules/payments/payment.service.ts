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
	StudentSemesterStatus,
} from "../../../generated/prisma/enums.js";
import {
	BkashCallbackParams,
	CreateAdmissionPaymentParams,
	ExecutePaymentParams,
	GetPaymentStatusParams,
} from "./payment.interface.js";
import { createStudentFromConfirmedAdmission } from "../students/student.service.js";

const ensureAdmissionValidForPayment = (
	admission: {
		userId: string;
		user: {
			status: string;
			emailVerified: boolean;
		};
		status: string;
		admissionFee: unknown;
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

	if (admission.status !== AdmissionStatus.APPROVED) {
		throw new AppError(
			409,
			"This admission has not been approved for payment.",
		);
	}
};

const ensureAdmissionPeriodOpen = async () => {
	const now = new Date();

	const admissionPeriod = await prisma.academicPeriod.findFirst({
		where: {
			type: "ADMISSION",
			isActive: true,
			startDate: {
				lte: now,
			},
			endDate: {
				gte: now,
			},
		},
		orderBy: {
			startDate: "desc",
		},
	});

	if (!admissionPeriod) {
		throw new AppError(409, "Admission payment is currently closed.");
	}

	return admissionPeriod;
};

const ensureNoDuplicatePayment = (
	transactions: Array<{
		status: string;
		bkashPaymentId: string | null;
	}>,
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

const ensureTransactionOwnership = (
	transaction: { userId: string },
	userId: string,
) => {
	if (transaction.userId !== userId) {
		throw new AppError(403, "You are not authorized to access this payment.");
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

const ensureAdmissionApprovedForPayment = (
	admission: { status: string } | null,
) => {
	if (!admission) {
		throw new AppError(
			409,
			"Admission information is missing for this transaction.",
		);
	}

	if (admission.status !== AdmissionStatus.APPROVED) {
		throw new AppError(409, "This admission is not approved for payment.");
	}
};

const validateBkashResult = (
	bkashResult: {
		transactionStatus?: string;
		trxID?: string;
		amount?: string;
	} | null,
	transaction: {
		amount: unknown;
	},
) => {
	if (!bkashResult) {
		throw new AppError(502, "Invalid response received from bKash.");
	}

	if (bkashResult.transactionStatus !== "Completed") {
		throw new AppError(
			409,
			`bKash payment was not completed. Status: ${bkashResult.transactionStatus ?? "Unknown"
			}`,
		);
	}

	if (!bkashResult.trxID) {
		throw new AppError(502, "bKash did not return a transaction ID.");
	}

	if (bkashResult.amount === undefined || bkashResult.amount === null) {
		throw new AppError(502, "bKash did not return the payment amount.");
	}

	if (Number(bkashResult.amount) !== Number(String(transaction.amount))) {
		throw new AppError(
			409,
			"Payment amount does not match the transaction amount.",
		);
	}
};

const finalizeSuccessfulPayment = async (
	transactionId: string,
	bkashResult: {
		transactionStatus?: string;
		trxID?: string;
		amount?: string;
	},
) => {
	const result = await prisma.$transaction(async (tx) => {
		const currentTransaction = await tx.transaction.findUnique({
			where: {
				id: transactionId,
			},
			include: {
				admission: true,
			},
		});

		if (!currentTransaction) {
			throw new AppError(
				404,
				"Payment transaction no longer exists.",
			);
		}

		if (currentTransaction.status === TransactionStatus.SUCCESS) {
			return {
				transaction: currentTransaction,
				admissionId: currentTransaction.admissionId,
			};
		}

		if (currentTransaction.status !== TransactionStatus.PENDING) {
			throw new AppError(
				409,
				"Payment transaction is no longer pending.",
			);
		}

		switch (currentTransaction.type) {
			case TransactionType.ADMISSION: {
				if (!currentTransaction.admission) {
					throw new AppError(
						409,
						"Admission information is missing for this transaction.",
					);
				}

				if (
					currentTransaction.admission.status !==
					AdmissionStatus.APPROVED
				) {
					throw new AppError(
						409,
						"This admission is no longer approved for payment.",
					);
				}

				const updatedTransaction = await tx.transaction.update({
					where: {
						id: currentTransaction.id,
					},
					data: {
						status: TransactionStatus.SUCCESS,
						bkashTrxId: bkashResult.trxID!,
						paidAt: new Date(),
					},
				});

				await tx.admission.update({
					where: {
						id: currentTransaction.admission.id,
					},
					data: {
						status: AdmissionStatus.CONFIRMED,
						confirmedAt: new Date(),
					},
				});

				return {
					transaction: updatedTransaction,
					admissionId: currentTransaction.admission.id,
				};
			}

			case TransactionType.SEMESTER_REGISTRATION: {
				if (!currentTransaction.studentSemesterId) {
					throw new AppError(
						409,
						"Student semester information is missing for this transaction.",
					);
				}

				const updatedTransaction = await tx.transaction.update({
					where: {
						id: currentTransaction.id,
					},
					data: {
						status: TransactionStatus.SUCCESS,
						bkashTrxId: bkashResult.trxID!,
						paidAt: new Date(),
					},
				});

				await tx.studentSemester.update({
					where: {
						id: currentTransaction.studentSemesterId,
					},
					data: {
						status: StudentSemesterStatus.REGISTERED,
						registeredAt: new Date(),
					},
				});

				return {
					transaction: updatedTransaction,
				};
			}

			default:
				throw new AppError(
					400,
					"This payment type is not supported yet.",
				);
		}
	});

	if (
		result.transaction.type === TransactionType.ADMISSION &&
		result.admissionId
	) {
		await createStudentFromConfirmedAdmission({
			admissionId: result.admissionId,
		});
	}

	return result.transaction;
};

export const createAdmissionPayment = async ({
	admissionId,
	userId,
}: CreateAdmissionPaymentParams) => {
	const admission = await prisma.admission.findUnique({
		where: {
			id: admissionId,
		},
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

	if (Number(admission.admissionFee) <= 0) {
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
			orderBy: {
				createdAt: "desc",
			},
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
			await prisma.transaction.update({
				where: {
					id: transaction.id,
				},
				data: {
					status: TransactionStatus.FAILED,
				},
			});

			throw new AppError(502, "bKash did not return a payment ID.");
		}

		const updatedTransaction = await prisma.transaction.update({
			where: {
				id: transaction.id,
			},
			data: {
				bkashPaymentId: bkashPayment.paymentID,
			},
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

		/*
		 * Do not assume that every database error means
		 * the external bKash payment failed.
		 *
		 * The transaction may need reconciliation through
		 * callback/status/query.
		 */
		throw new AppError(
			502,
			"Unable to create bKash payment. Please try again.",
		);
	}
};

export const executePayment = async ({
	paymentID,
	userId,
}: ExecutePaymentParams) => {
	const transaction = await prisma.transaction.findUnique({
		where: {
			bkashPaymentId: paymentID,
		},
		include: {
			admission: true,
			studentSemester: true,
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
			ensureAdmissionApprovedForPayment(transaction.admission);
			break;

		case TransactionType.SEMESTER_REGISTRATION:
			if (transaction.studentSemester?.status !== StudentSemesterStatus.PENDING) {
				throw new AppError(409, "Semester is not in a valid state for payment completion.");
			}
			break;

		default:
			throw new AppError(400, "This payment type is not supported yet.");
	}

	const bkashResult = await executeBkashPayment(paymentID);

	validateBkashResult(bkashResult, transaction);

	const result = await finalizeSuccessfulPayment(transaction.id, bkashResult);

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
		where: {
			id: transactionId,
		},
		include: {
			admission: true,
		},
	});

	if (!transaction) {
		throw new AppError(404, "Payment transaction not found.");
	}

	ensureTransactionOwnership(transaction, userId);

	/*
	 * Status endpoint should report the final
	 * transaction state instead of treating FAILED
	 * as an execution error.
	 */
	if (transaction.status === TransactionStatus.SUCCESS) {
		return {
			transaction,
			message: "Payment has already been completed.",
		};
	}

	if (transaction.status === TransactionStatus.FAILED) {
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

	if (transaction.status === TransactionStatus.CANCELLED) {
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

	validateBkashResult(bkashResult, transaction);

	const result = await finalizeSuccessfulPayment(transaction.id, bkashResult);

	return {
		transaction: result,
		bkash: {
			paymentID: transaction.bkashPaymentId,
			trxID: bkashResult.trxID,
			transactionStatus: bkashResult.transactionStatus,
		},
	};
};

export const handleBkashCallback = async ({
	paymentID,
	status,
}: BkashCallbackParams) => {
	if (!paymentID) {
		throw new AppError(400, "bKash payment ID is required.");
	}

	const transaction = await prisma.transaction.findUnique({
		where: {
			bkashPaymentId: paymentID,
		},
		select: {
			id: true,
			status: true,
			bkashPaymentId: true,
			amount: true,
		},
	});

	if (!transaction) {
		throw new AppError(404, "Payment transaction not found.");
	}

	if (transaction.status === TransactionStatus.SUCCESS) {
		return {
			transactionId: transaction.id,
			status: transaction.status,
			message: "Payment has already been completed.",
		};
	}

	/*
	 * The callback status itself is not treated
	 * as proof of successful payment.
	 *
	 * We still ask bKash for the actual payment
	 * result before updating our database.
	 */
	const bkashResult = await queryBkashPayment(paymentID);

	if (!bkashResult) {
		throw new AppError(502, "Invalid response received from bKash.");
	}

	if (bkashResult.transactionStatus !== "Completed") {
		return {
			transactionId: transaction.id,
			status: transaction.status,
			bkash: {
				paymentID,
				transactionStatus: bkashResult.transactionStatus ?? status ?? "Unknown",
				trxID: bkashResult.trxID ?? null,
			},
			message: "Payment was not completed.",
		};
	}

	validateBkashResult(bkashResult, {
		amount: transaction.amount,
	});

	const result = await finalizeSuccessfulPayment(transaction.id, bkashResult);

	return {
		transaction: result,
		bkash: {
			paymentID,
			trxID: bkashResult.trxID,
			transactionStatus: bkashResult.transactionStatus,
		},
		message: "Payment completed successfully.",
	};
};
