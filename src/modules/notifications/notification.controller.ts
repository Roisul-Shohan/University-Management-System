/** biome-ignore-all assist/source/organizeImports: <explanation> */
import type { Request, Response } from "express";

import sendResponse from "../../utils/sendResponse";
import {
	getMyNotificationById,
	getMyNotifications,
	getUnreadNotificationCount,
	markAllNotificationsAsRead,
	markNotificationAsRead,
} from "./notification.service";
import catchAsync from "../../utils/catchAsync";

export const getMyNotificationsController = catchAsync(
	async (req: Request, res: Response) => {
		const userId = req.user!.userId;

		const result = await getMyNotifications(userId, req.query as any);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Notifications retrieved successfully.",
			data: result.data,
			meta: result.meta,
		});
	},
);

export const getMyNotificationByIdController = catchAsync(
	async (req: Request, res: Response) => {
		const userId = req.user!.userId;

		const notification = await getMyNotificationById(
			userId,
			req.params.id as string,
		);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Notification retrieved successfully.",
			data: notification,
		});
	},
);

export const markNotificationAsReadController = catchAsync(
	async (req: Request, res: Response) => {
		const userId = req.user!.userId;

		const notification = await markNotificationAsRead(
			userId,
			req.params.id as string,
		);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Notification marked as read successfully.",
			data: notification,
		});
	},
);

export const markAllNotificationsAsReadController = catchAsync(
	async (req: Request, res: Response) => {
		const userId = req.user!.userId;

		const result = await markAllNotificationsAsRead(userId);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "All notifications marked as read successfully.",
			data: result,
		});
	},
);

export const getUnreadNotificationCountController = catchAsync(
	async (req: Request, res: Response) => {
		const userId = req.user!.userId;

		const result = await getUnreadNotificationCount(userId);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Unread notification count retrieved successfully.",
			data: result,
		});
	},
);
