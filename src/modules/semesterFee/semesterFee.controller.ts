import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import * as semesterFeeService from "./semesterFee.service.js";

export const createSemesterFee = catchAsync(async (req: Request, res: Response) => {
    const result = await semesterFeeService.createSemesterFee(req.body);
    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "Semester fee created successfully",
        data: result,
    });
});

export const getAllSemesterFees = catchAsync(async (req: Request, res: Response) => {
    const result = await semesterFeeService.getAllSemesterFees();
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Semester fees retrieved successfully",
        data: result,
    });
});

export const updateSemesterFee = catchAsync(async (req: Request, res: Response) => {
    const result = await semesterFeeService.updateSemesterFee(req.params.id as string, req.body);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Semester fee updated successfully",
        data: result,
    });
});

export const deleteSemesterFee = catchAsync(async (req: Request, res: Response) => {
    const result = await semesterFeeService.deleteSemesterFee(req.params.id as string);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Semester fee deleted successfully",
        data: result,
    });
});
