import type { Request, Response } from "express";
import AppError from "../../errors/AppErrors.js";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import * as service from "./examAttempt.service.js";

const userId = (req: Request) => {
	if (!req.user) throw new AppError(401, "Authentication is required.");
	return req.user.userId;
};

export const start = catchAsync(async (req: Request, res: Response) => {
	const data = await service.startExamAttempt(
		userId(req),
		req.params.examId as string,
	);
	sendResponse(res, {
		statusCode: 201,
		success: true,
		message: "Exam attempt started successfully.",
		data,
	});
});

export const get = catchAsync(async (req: Request, res: Response) => {
	const data = await service.getExamAttempt(
		userId(req),
		req.params.attemptId as string,
	);
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Exam attempt retrieved successfully.",
		data,
	});
});

export const submit = catchAsync(async (req: Request, res: Response) => {
	const data = await service.submitExamAttempt(
		userId(req),
		req.params.attemptId as string,
		req.body,
	);
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Exam attempt submitted successfully.",
		data,
	});
});
