import { Request, Response } from "express";;
import sendResponse from "../../utils/sendResponse.js";
import * as departmentService from "./department.service.js";
import catchAsync from "../../utils/catchAsync.js";

export const createDepartment = catchAsync(
	async (req: Request, res: Response) => {
		const result = await departmentService.createDepartment(req.body);

		sendResponse(res, {
			statusCode: 201,
			success: true,
			message: "Department created successfully.",
			data: result,
		});
	},
);

export const getAllDepartments = catchAsync(
	async (req: Request, res: Response) => {
		const result = await departmentService.getAllDepartments();

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Departments retrieved successfully.",
			data: result,
		});
	},
);

export const getDepartmentById = catchAsync(
	async (req: Request, res: Response) => {
		const id = req.params.id as string;

		const result = await departmentService.getDepartmentById(id);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Department retrieved successfully.",
			data: result,
		});
	},
);

export const updateDepartment = catchAsync(
	async (req: Request, res: Response) => {
		const id =req.params.id as string;

		const result = await departmentService.updateDepartment(
			id,
			req.body,
		);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Department updated successfully.",
			data: result,
		});
	},
);

export const deleteDepartment = catchAsync(
	async (req: Request, res: Response) => {
		const id = req.params.id as string;

		await departmentService.deleteDepartment(id);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Department deleted successfully.",
			data: null,
		});
	},
);