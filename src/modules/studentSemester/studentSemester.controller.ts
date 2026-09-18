import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import * as studentSemesterService from "./studentSemester.service.js";

export const initiatePayment = catchAsync(async (req: Request, res: Response) => {
    const result = await studentSemesterService.initiateSemesterPayment({
        studentSemesterId: req.params.studentSemesterId as string,
        userId: req.user!.userId,
    });

    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "Semester payment initiated successfully.",
        data: result,
    });
});

export const initiateCoursePayment = catchAsync(async (req: Request, res: Response) => {
    const result = await studentSemesterService.initiateCourseRegistrationPayment({
        studentSemesterId: req.params.studentSemesterId as string,
        userId: req.user!.userId,
    });

    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "Course registration payment initiated successfully.",
        data: result,
    });
});
