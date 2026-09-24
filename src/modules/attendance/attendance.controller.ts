import type { Request, Response } from "express";
import AppError from "../../errors/AppErrors.js";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import * as service from "./attendance.service.js";

const userId = (req: Request) => {
	if (!req.user) throw new AppError(401, "Authentication is required.");
	return req.user.userId;
};

export const open = catchAsync(async (req: Request, res: Response) => {
	const data = await service.openAttendanceSession(userId(req), req.body);
	sendResponse(res, {
		statusCode: 201,
		success: true,
		message: "Attendance session opened successfully.",
		data,
	});
});

export const close = catchAsync(async (req: Request, res: Response) => {
	const data = await service.closeAttendanceSession(
		userId(req),
		req.params.id as string,
	);
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Attendance session closed successfully.",
		data,
	});
});

export const get = catchAsync(async (req: Request, res: Response) => {
	const data = await service.getAttendanceSession(
		req.params.id as string,
		userId(req),
	);
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Attendance session retrieved successfully.",
		data,
	});
});

export const mark = catchAsync(async (req: Request, res: Response) => {
	const data = await service.markAttendance(userId(req), {
		attendanceSessionId: req.params.id as string,
		qrToken: req.body.qrToken,
	});
	sendResponse(res, {
		statusCode: 201,
		success: true,
		message: "Attendance marked successfully.",
		data,
	});
});

export const updateRecord = catchAsync(async (req: Request, res: Response) => {
	const data = await service.updateAttendanceRecord(
		userId(req),
		req.params.sessionId as string,
		req.params.recordId as string,
		req.body,
	);
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Attendance record updated successfully.",
		data,
	});
});
