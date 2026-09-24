import type { Request, Response } from "express";
import AppError from "../../errors/AppErrors.js";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import * as service from "./courseOffering.service.js";

const userId = (req: Request) => {
  if (!req.user) throw new AppError(401, "Authentication is required.");
  return req.user.userId;
};

export const create = catchAsync(async (req: Request, res: Response) => {
  const result = await service.createCourseOffering(userId(req), req.body);
  sendResponse(res, { statusCode: 201, success: true, message: "Course offering created successfully.", data: result });
});

export const list = catchAsync(async (req: Request, res: Response) => {
  const result = await service.getCourseOfferings(req.query);
  sendResponse(res, { statusCode: 200, success: true, message: "Course offerings retrieved successfully.", data: result });
});

export const getById = catchAsync(async (req: Request, res: Response) => {
  const result = await service.getCourseOfferingById(req.params.id as string);
  sendResponse(res, { statusCode: 200, success: true, message: "Course offering retrieved successfully.", data: result });
});

export const update = catchAsync(async (req: Request, res: Response) => {
  const result = await service.updateCourseOffering(userId(req), req.params.id as string, req.body);
  sendResponse(res, { statusCode: 200, success: true, message: "Course offering updated successfully.", data: result });
});

export const remove = catchAsync(async (req: Request, res: Response) => {
  await service.deleteCourseOffering(userId(req), req.params.id as string);
  sendResponse(res, { statusCode: 200, success: true, message: "Course offering deleted successfully.", data: null });
});
