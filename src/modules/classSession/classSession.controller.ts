import type { Request, Response } from "express";
import AppError from "../../errors/AppErrors.js";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import * as service from "./classSession.service.js";

const userId = (req: Request) => {
	if (!req.user) throw new AppError(401, "Authentication is required.");
	return req.user.userId;
};

export const create = catchAsync(async (req: Request, res: Response) => {
	const result = await service.createClassSession(userId(req), req.body);
	sendResponse(res, {
		statusCode: 201,
		success: true,
		message: "Class session created successfully.",
		data: result,
	});
});

export const list = catchAsync(async (req: Request, res: Response) => {
	const result = await service.getClassSessions(req.query);
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Class sessions retrieved successfully.",
		data: result,
	});
});

export const getById = catchAsync(async (req: Request, res: Response) => {
	const result = await service.getClassSessionById(req.params.id as string);
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Class session retrieved successfully.",
		data: result,
	});
});

export const update = catchAsync(async (req: Request, res: Response) => {
	const result = await service.updateClassSession(
		userId(req),
		req.params.id as string,
		req.body,
	);
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Class session updated successfully.",
		data: result,
	});
});

export const remove = catchAsync(async (req: Request, res: Response) => {
	await service.deleteClassSession(userId(req), req.params.id as string);
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Class session deleted successfully.",
		data: null,
	});
});
