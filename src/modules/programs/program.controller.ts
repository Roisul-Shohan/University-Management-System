import type { Request, Response } from "express";
import AppError from "../../errors/AppErrors.js";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import * as programService from "./program.service.js";

const getUserId = (req: Request) => {
	if (!req.user) throw new AppError(401, "Authentication is required.");
	return req.user.userId;
};

export const createProgram = catchAsync(async (req: Request, res: Response) => {
	const program = await programService.createProgram(getUserId(req), req.body);
	sendResponse(res, {
		statusCode: 201,
		success: true,
		message: "Program created successfully.",
		data: program,
	});
});

export const getPrograms = catchAsync(async (req: Request, res: Response) => {
	const programs = await programService.getPrograms({
		departmentId: req.query.departmentId as string | undefined,
	});
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Programs retrieved successfully.",
		data: programs,
	});
});

export const getProgramById = catchAsync(async (req: Request, res: Response) => {
	const program = await programService.getProgramById(req.params.id as string);
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Program retrieved successfully.",
		data: program,
	});
});

export const updateProgram = catchAsync(async (req: Request, res: Response) => {
	const program = await programService.updateProgram(
		getUserId(req),
		req.params.id as string,
		req.body,
	);
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Program updated successfully.",
		data: program,
	});
});

export const deleteProgram = catchAsync(async (req: Request, res: Response) => {
	await programService.deleteProgram(getUserId(req), req.params.id as string);
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Program deleted successfully.",
		data: null,
	});
});
