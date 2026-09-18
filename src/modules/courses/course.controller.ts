import type { Request, Response } from "express";
import AppError from "../../errors/AppErrors.js";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import * as courseService from "./course.service.js";

const getUserId = (req: Request) => {
  if (!req.user) throw new AppError(401, "Authentication is required.");
  return req.user.userId;
};

export const createCourse = catchAsync(async (req: Request, res: Response) => {
  const course = await courseService.createCourse(getUserId(req), req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Course created successfully.",
    data: course,
  });
});

export const getCourses = catchAsync(async (req: Request, res: Response) => {
  const courses = await courseService.getCourses({
    departmentId: req.query.departmentId as string | undefined,
  });
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Courses retrieved successfully.",
    data: courses,
  });
});

export const getCourseById = catchAsync(async (req: Request, res: Response) => {
  const course = await courseService.getCourseById(req.params.id as string);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Course retrieved successfully.",
    data: course,
  });
});

export const updateCourse = catchAsync(async (req: Request, res: Response) => {
  const course = await courseService.updateCourse(
    getUserId(req),
    req.params.id as string,
    req.body,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Course updated successfully.",
    data: course,
  });
});

export const deleteCourse = catchAsync(async (req: Request, res: Response) => {
  await courseService.deleteCourse(getUserId(req), req.params.id as string);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Course deleted successfully.",
    data: null,
  });
});
