import type { Request, Response } from "express";
import AppError from "../../errors/AppErrors.js";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import * as teacherService from "./teacher.service.js";

const getUserId = (req: Request) => {
  if (!req.user) throw new AppError(401, "Authentication is required.");
  return req.user.userId;
};

export const applyAsTeacher = catchAsync(
  async (req: Request, res: Response) => {
    const application = await teacherService.applyAsTeacher({
      userId: getUserId(req),
      departmentId: req.body.departmentId,
      joiningYear: req.body.joiningYear,
    });
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Teacher application submitted successfully.",
      data: application,
    });
  },
);

export const getMyTeacherApplication = catchAsync(
  async (req: Request, res: Response) => {
    const application = await teacherService.getMyTeacherApplication(
      getUserId(req),
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Teacher application retrieved successfully.",
      data: application,
    });
  },
);

export const getMyTeacherProfile = catchAsync(
  async (req: Request, res: Response) => {
    const teacher = await teacherService.getMyTeacherProfile(getUserId(req));
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Teacher profile retrieved successfully.",
      data: teacher,
    });
  },
);

export const getTeacherApplications = catchAsync(
  async (req: Request, res: Response) => {
    const applications = await teacherService.getTeacherApplications({
      reviewerId: getUserId(req),
      status: req.query.status as
        | "PENDING"
        | "APPROVED"
        | "REJECTED"
        | undefined,
    });
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Teacher applications retrieved successfully.",
      data: applications,
    });
  },
);

export const approveTeacherApplication = catchAsync(
  async (req: Request, res: Response) => {
    const teacher = await teacherService.approveTeacherApplication({
      applicationId: req.params.id as string,
      reviewerId: getUserId(req),
    });
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Teacher application approved successfully.",
      data: teacher,
    });
  },
);

export const rejectTeacherApplication = catchAsync(
  async (req: Request, res: Response) => {
    const application = await teacherService.rejectTeacherApplication({
      applicationId: req.params.id as string,
      reviewerId: getUserId(req),
      rejectionReason: req.body.rejectionReason,
    });
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Teacher application rejected successfully.",
      data: application,
    });
  },
);
