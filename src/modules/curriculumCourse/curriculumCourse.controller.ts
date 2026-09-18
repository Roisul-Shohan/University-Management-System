import type { Request, Response } from "express";
import AppError from "../../errors/AppErrors.js";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import * as curriculumCourseService from "./curriculumCourse.service.js";

const getUserId = (req: Request) => {
  if (!req.user) throw new AppError(401, "Authentication is required.");
  return req.user.userId;
};

export const createCurriculumCourse = catchAsync(
  async (req: Request, res: Response) => {
    const curriculumCourse =
      await curriculumCourseService.createCurriculumCourse(
        getUserId(req),
        req.body,
      );

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Curriculum course created successfully.",
      data: curriculumCourse,
    });
  },
);

export const getCurriculumCourses = catchAsync(
  async (req: Request, res: Response) => {
    const curriculumCourses =
      await curriculumCourseService.getCurriculumCourses({
        programId: req.query.programId as string | undefined,
        year: req.query.year !== undefined ? Number(req.query.year) : undefined,
        semester:
          req.query.semester !== undefined
            ? Number(req.query.semester)
            : undefined,
      });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Curriculum courses retrieved successfully.",
      data: curriculumCourses,
    });
  },
);

export const getCurriculumCourseById = catchAsync(
  async (req: Request, res: Response) => {
    const curriculumCourse =
      await curriculumCourseService.getCurriculumCourseById(
        req.params.id as string,
      );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Curriculum course retrieved successfully.",
      data: curriculumCourse,
    });
  },
);

export const updateCurriculumCourse = catchAsync(
  async (req: Request, res: Response) => {
    const curriculumCourse =
      await curriculumCourseService.updateCurriculumCourse(
        getUserId(req),
        req.params.id as string,
        req.body,
      );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Curriculum course updated successfully.",
      data: curriculumCourse,
    });
  },
);

export const deleteCurriculumCourse = catchAsync(
  async (req: Request, res: Response) => {
    await curriculumCourseService.deleteCurriculumCourse(
      getUserId(req),
      req.params.id as string,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Curriculum course deleted successfully.",
      data: null,
    });
  },
);
