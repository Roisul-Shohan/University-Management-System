import type { Request, Response } from "express";

import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import {
	getUserById,
	getUsers,
	updateProfile,
	updateUserStatus,
} from "./users.service.js";

export const getUsersController = catchAsync(
	async (req: Request, res: Response) => {
		const result = await getUsers(req.query as any);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Users retrieved successfully.",
			data: result.users,
			meta: result.meta,
		});
	},
);

export const getUserByIdController = catchAsync(
	async (req: Request, res: Response) => {
		const user = await getUserById(req.params.id as string);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "User retrieved successfully.",
			data: user,
		});
	},
);

export const updateProfileController = catchAsync(
	async (req: Request, res: Response) => {
		const user = await updateProfile(req.user!.userId, req.body);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Profile updated successfully.",
			data: user,
		});
	},
);

export const updateUserStatusController = catchAsync(
	async (req: Request, res: Response) => {
		const user = await updateUserStatus(
			req.params.id as string,
			req.body.status,
		);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "User status updated successfully.",
			data: user,
		});
	},
);
