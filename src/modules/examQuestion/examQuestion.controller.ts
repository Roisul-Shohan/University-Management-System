import type { Request, Response } from "express";
import AppError from "../../errors/AppErrors.js";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import * as service from "./examQuestion.service.js";

const userId = (req: Request) => {
	if (!req.user) throw new AppError(401, "Authentication is required.");
	return req.user.userId;
};

export const list = catchAsync(async (req: Request, res: Response) => {
	const data = await service.getExamQuestions(
		req.params.examId as string,
		userId(req),
	);
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Exam questions retrieved successfully.",
		data,
	});
});

export const create = catchAsync(async (req: Request, res: Response) => {
	const data = await service.createExamQuestion(
		userId(req),
		req.params.examId as string,
		req.body,
	);
	sendResponse(res, {
		statusCode: 201,
		success: true,
		message: "Exam question created successfully.",
		data,
	});
});

export const update = catchAsync(async (req: Request, res: Response) => {
	const data = await service.updateExamQuestion(
		userId(req),
		req.params.examId as string,
		req.params.questionId as string,
		req.body,
	);
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Exam question updated successfully.",
		data,
	});
});

export const remove = catchAsync(async (req: Request, res: Response) => {
	await service.deleteExamQuestion(
		userId(req),
		req.params.examId as string,
		req.params.questionId as string,
	);
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Exam question deleted successfully.",
		data: null,
	});
});
