import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import * as admissionService from "./admission.service.js";
import { AdmissionStatus } from "../../../generated/prisma/enums.js";

export const createAdmission = catchAsync(
	async (req: Request, res: Response) => {
		const admission = await admissionService.createAdmission({
			userId: req.user!.userId,
			programId: req.body.programId,
			admissionYear: req.body.admissionYear,
		});

		sendResponse(res, {
			statusCode: 201,
			success: true,
			message: "Admission application submitted successfully.",
			data: admission,
		});
	},
);

export const approveAdmission = catchAsync(
	async (req: Request, res: Response) => {
		const admission = await admissionService.approveAdmission({
			admissionId: req.params.admissionId as string,
			userId: req.user!.userId,
		});

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Admission approved successfully.",
			data: admission,
		});
	},
);

export const rejectAdmission = catchAsync(
	async (req: Request, res: Response) => {
		const admission = await admissionService.rejectAdmission({
			admissionId: req.params.admissionId as string,
			userId: req.user!.userId,
		});

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Admission rejected successfully.",
			data: admission,
		});
	},
);

export const getMyAdmissions = catchAsync(
	async (req: Request, res: Response) => {
		const admissions = await admissionService.getMyAdmissions(req.user!.userId);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Your admissions retrieved successfully.",
			data: admissions,
		});
	},
);

export const getAdmissionById = catchAsync(
	async (req: Request, res: Response) => {
		const admission = await admissionService.getAdmissionById({
			admissionId: req.params.admissionId as string,
			userId: req.user!.userId,
		});

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Admission retrieved successfully.",
			data: admission,
		});
	},
);

export const getAdmissions = catchAsync(async (req: Request, res: Response) => {
	const admissions = await admissionService.getAdmissions({
		userId: req.user!.userId,
		status: req.query.status as AdmissionStatus | undefined,
		admissionYear: req.query.admissionYear
			? Number(req.query.admissionYear)
			: undefined,
		programId: req.query.programId as string | undefined,
	});

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Admissions retrieved successfully.",
		data: admissions,
	});
});
