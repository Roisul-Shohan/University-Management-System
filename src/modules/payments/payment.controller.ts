import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import * as paymentService from "./payment.service.js";

export const createAdmissionPayment = catchAsync(
	async (req: Request, res: Response) => {
		const result = await paymentService.createAdmissionPayment({
			admissionId: req.params.admissionId as string,
			userId: req.user!.userId,
		});

		sendResponse(res, {
			statusCode: 201,
			success: true,
			message: "Admission payment created successfully.",
			data: result,
		});
	},
);

export const executePayment = catchAsync(
	async (req: Request, res: Response) => {
		const result = await paymentService.executePayment({
			paymentID: req.body.paymentID,
			userId: req.user!.userId,
		});

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Payment completed successfully.",
			data: result,
		});
	},
);

export const getPaymentStatus = catchAsync(
	async (req: Request, res: Response) => {
		const result = await paymentService.getPaymentStatus({
			transactionId: req.params.transactionId as string,
			userId: req.user!.userId,
		});

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Payment status retrieved successfully.",
			data: result,
		});
	},
);

export const handleBkashCallback = catchAsync(
	async (req: Request, res: Response) => {
		const result = await paymentService.handleBkashCallback({
			paymentID: req.query.paymentID as string,
			status: req.query.status as string | undefined,
		});

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "bKash callback processed successfully.",
			data: result,
		});
	},
);
