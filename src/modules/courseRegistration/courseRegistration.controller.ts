import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import * as courseRegistrationService from "./courseRegistration.service.js";

export const getAvailableCourses = catchAsync(
  async (req: Request, res: Response) => {
    const data = await courseRegistrationService.getAvailableCourseOfferings({
      studentSemesterId: req.params.studentSemesterId as string,
      userId: req.user!.userId,
    });
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Available courses retrieved successfully.",
      data,
    });
  },
);

export const registerCourse = catchAsync(
  async (req: Request, res: Response) => {
    const data = await courseRegistrationService.registerCourse({
      studentSemesterId: req.params.studentSemesterId as string,
      userId: req.user!.userId,
      courseOfferingId: req.body.courseOfferingId,
    });
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Course selected successfully. Complete payment to enroll.",
      data,
    });
  },
);

export const dropCourse = catchAsync(async (req: Request, res: Response) => {
  const data = await courseRegistrationService.dropCourse({
    studentSemesterId: req.params.studentSemesterId as string,
    userId: req.user!.userId,
    courseOfferingId: req.params.courseOfferingId as string,
  });
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Course selection removed successfully.",
    data,
  });
});
