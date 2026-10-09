import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import * as studentService from "./student.service.js";
import { prisma } from "../../lib/prisma.js";



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
	const role = req.user!.role;
	const userId = req.user!.userId;

	let departmentId = req.query.departmentId as string | undefined;

	// Teachers can only see students in their department
	if (role === "TEACHER") {
		const teacher = await prisma.teacher.findUnique({ where: { id: userId } });
		if (teacher) {
			departmentId = teacher.departmentId;
		}
	}

	const result = await studentService.getStudents({
		programId: req.query.programId as string | undefined,
		departmentId,
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
