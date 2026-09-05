import type { NextFunction, Request, Response } from "express";

import httpStatus from "http-status";
import { ZodError } from "zod";
import { Prisma } from "../../generated/prisma/client";

const globalErrorHandler = (
	err: any,
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	let statusCode = 500;
	let message = "Something went wrong";
	let errorName = err.name || "Inernel Server Error";

	if (err?.statusCode) {
		statusCode = err.statusCode;
	}

	if (err?.message) {
		message = err.message;
	}

	if (err instanceof Prisma.PrismaClientValidationError) {
		statusCode = httpStatus.BAD_REQUEST;
		message = "You have provided incorrect field type or missing fields";
	} else if (err instanceof Prisma.PrismaClientKnownRequestError) {
		if (err.code === "P2002") {
			(statusCode = httpStatus.BAD_REQUEST), (message = "Duplicate Key Error");
		} else if (err.code === "P2003") {
			(statusCode = httpStatus.BAD_REQUEST),
				(message = "Foreign key constraint failed");
		} else if (err.code === "P2025") {
			(statusCode = httpStatus.BAD_REQUEST),
				(message =
					"An operation failed because it depends on one or more records that were required but not found.");
		}
	} else if (err instanceof Prisma.PrismaClientInitializationError) {
		if (err.errorCode === "P1000") {
			statusCode = httpStatus.UNAUTHORIZED;
			message =
				"Authentication failed against database server. Please Check Your Credentials";
		} else if (err.errorCode === "P1001") {
			statusCode = httpStatus.BAD_REQUEST;
			message = "Can't reach database server";
		}
	} else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
		statusCode = httpStatus.INTERNAL_SERVER_ERROR;
		message = "Error occurred during query execution";
	}

	if (err instanceof ZodError) {
		return res.status(400).json({
			success: false,
			statusCode: 400,
			message: "Validation failed",
			errors: err.issues.map((issue) => ({
				field: issue.path.join("."),
				message: issue.message,
			})),
		});
	}

	res.status(statusCode).json({
		success: false,
		statusCode,
		errorName,
		message,
		errors: err.stack,
	});
};

export default globalErrorHandler;
