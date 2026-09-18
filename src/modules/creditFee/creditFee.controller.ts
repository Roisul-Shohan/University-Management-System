import type { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import * as creditFeeService from "./creditFee.service.js";

export const createCreditFee = catchAsync(
  async (req: Request, res: Response) => {
    const result = await creditFeeService.createCreditFee(req.body);
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Per-credit fee created successfully",
      data: result,
    });
  },
);

export const getAllCreditFees = catchAsync(
  async (_req: Request, res: Response) => {
    const result = await creditFeeService.getAllCreditFees();
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Credit fees retrieved successfully",
      data: result,
    });
  },
);

export const getCreditFeeById = catchAsync(
  async (req: Request, res: Response) => {
    const result = await creditFeeService.getCreditFeeById(
      req.params.id as string,
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Credit fee retrieved successfully",
      data: result,
    });
  },
);

export const updateCreditFee = catchAsync(
  async (req: Request, res: Response) => {
    const result = await creditFeeService.updateCreditFee(
      req.params.id as string,
      req.body,
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Credit fee updated successfully",
      data: result,
    });
  },
);

export const deleteCreditFee = catchAsync(
  async (req: Request, res: Response) => {
    const result = await creditFeeService.deleteCreditFee(
      req.params.id as string,
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Credit fee deleted successfully",
      data: result,
    });
  },
);
