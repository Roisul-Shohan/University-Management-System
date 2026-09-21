import type { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import * as admissionFeeService from "./admissionFee.service.js";

export const createAdmissionFee = catchAsync(
  async (req: Request, res: Response) => {
    const result = await admissionFeeService.createAdmissionFee(req.body);
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Admission fee created successfully",
      data: result,
    });
  },
);

export const getAllAdmissionFees = catchAsync(
  async (_req: Request, res: Response) => {
    const result = await admissionFeeService.getAllAdmissionFees();
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Admission fees retrieved successfully",
      data: result,
    });
  },
);

export const getAdmissionFeeById = catchAsync(
  async (req: Request, res: Response) => {
    const result = await admissionFeeService.getAdmissionFeeById(
      req.params.id as string,
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Admission fee retrieved successfully",
      data: result,
    });
  },
);

export const updateAdmissionFee = catchAsync(
  async (req: Request, res: Response) => {
    const result = await admissionFeeService.updateAdmissionFee(
      req.params.id as string,
      req.body,
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Admission fee updated successfully",
      data: result,
    });
  },
);

export const deleteAdmissionFee = catchAsync(
  async (req: Request, res: Response) => {
    const result = await admissionFeeService.deleteAdmissionFee(
      req.params.id as string,
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Admission fee deleted successfully",
      data: result,
    });
  },
);
