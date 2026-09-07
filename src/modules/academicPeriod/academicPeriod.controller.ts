import type { Request, Response } from "express";

import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import {
	createAcademicPeriod,
	getAcademicPeriodById,
	getAcademicPeriods,
	getCurrentAcademicPeriods,
	updateAcademicPeriod,
	updateAcademicPeriodStatus,
} from "./academicPeriod.service.js";

export const createAcademicPeriodController = catchAsync(
	async (req: Request, res: Response) => {
		const academicPeriod = await createAcademicPeriod(req.body);

		sendResponse(res, {
			statusCode: 201,
			success: true,
			message: "Academic period created successfully.",
			data: academicPeriod,
		});
	},
);

export const getAcademicPeriodsController = catchAsync(
	async (req: Request, res: Response) => {
		const result = await getAcademicPeriods(req.query as any);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Academic periods retrieved successfully.",
			data: result.data,
			meta: result.meta,
		});
	},
);

export const getAcademicPeriodByIdController = catchAsync(
	async (req: Request, res: Response) => {
		const academicPeriod = await getAcademicPeriodById(req.params.id as string);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Academic period retrieved successfully.",
			data: academicPeriod,
		});
	},
);

export const updateAcademicPeriodController = catchAsync(
	async (req: Request, res: Response) => {
		const academicPeriod = await updateAcademicPeriod(
			req.params.id as string,
			req.body,
		);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Academic period updated successfully.",
			data: academicPeriod,
		});
	},
);

export const updateAcademicPeriodStatusController = catchAsync(
	async (req: Request, res: Response) => {
		const academicPeriod = await updateAcademicPeriodStatus(
			req.params.id as string,
			req.body,
		);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: `Academic period ${
				academicPeriod.isActive ? "activated" : "deactivated"
			} successfully.`,
			data: academicPeriod,
		});
	},
);

export const getCurrentAcademicPeriodsController = catchAsync(
	async (req: Request, res: Response) => {
		const periods = await getCurrentAcademicPeriods();

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Current academic periods retrieved successfully.",
			data: periods,
		});
	},
);
