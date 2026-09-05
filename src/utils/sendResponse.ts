import type { Response } from "express";

type TMeta = {
    page: number;
    limit: number;
    total: number;
}

type TResponse<T> = {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
  meta ? : TMeta;
};

const sendResponse = <T>(res: Response, data: TResponse<T>) => {
  res.status(data.statusCode).json({
    success: data.success,
    statusCode : data.statusCode,
    message: data.message,
    data: data.data,
    meta : data.meta
  });
};

export default sendResponse;