import type { Request, Response } from "express";
import AppError from "../../errors/AppErrors.js";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import * as service from "./exam.service.js";

const userId = (req: Request) => {
	if (!req.user) throw new AppError(401, "Authentication is required.");
	return req.user.userId;
};

export const create = catchAsync(async (req: Request, res: Response) => {
	const data = await service.createExam(userId(req), req.body);
	sendResponse(res, {
		statusCode: 201,
		success: true,
		message: "Exam created successfully.",
		data,
	});
});

export const list = catchAsync(async (req: Request, res: Response) => {
	const data = await service.getExams(req.query, userId(req));
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Exams retrieved successfully.",
		data,
	});
});

export const get = catchAsync(async (req: Request, res: Response) => {
	const data = await service.getExamById(req.params.id as string, userId(req));
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Exam retrieved successfully.",
		data,
	});
});

export const update = catchAsync(async (req: Request, res: Response) => {
	const data = await service.updateExam(
		userId(req),
		req.params.id as string,
		req.body,
	);
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Exam updated successfully.",
		data,
	});
});

export const publish = catchAsync(async (req: Request, res: Response) => {
	const data = await service.publishExam(userId(req), req.params.id as string);
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Exam published successfully.",
		data,
	});
});

export const close = catchAsync(async (req: Request, res: Response) => {
	const data = await service.closeExam(userId(req), req.params.id as string);
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Exam closed successfully.",
		data,
	});
});

export const remove = catchAsync(async (req: Request, res: Response) => {
	await service.deleteExam(userId(req), req.params.id as string);
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Exam deleted successfully.",
		data: null,
	});
});
