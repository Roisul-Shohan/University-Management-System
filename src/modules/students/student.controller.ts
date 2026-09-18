import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import * as studentService from "./student.service.js";



export const getMyStudentProfile = catchAsync(
	async (req: Request, res: Response) => {
		const result = await studentService.getMyStudentProfile(req.user!.userId);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Student profile retrieved successfully.",
			data: result,
		});
	},
);

export const getStudent = catchAsync(async (req: Request, res: Response) => {
	const result = await studentService.getStudent({
		studentId: req.params.studentId as string,
	});

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Student retrieved successfully.",
		data: result,
	});
});

export const getStudents = catchAsync(async (req: Request, res: Response) => {
	const result = await studentService.getStudents({
		programId: req.query.programId as string | undefined,

		departmentId: req.query.departmentId as string | undefined,

		admissionYear: req.query.admissionYear
			? Number(req.query.admissionYear)
			: undefined,

		currentYear: req.query.currentYear
			? Number(req.query.currentYear)
			: undefined,

		currentSemester: req.query.currentSemester
			? Number(req.query.currentSemester)
			: undefined,

		isActive:
			req.query.isActive !== undefined
				? req.query.isActive === "true"
				: undefined,
	});

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Students retrieved successfully.",
		data: result,
	});
});
