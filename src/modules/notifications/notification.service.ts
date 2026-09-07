import AppError from "../../errors/AppErrors";
import { prisma } from "../../lib/prisma";
import type { IGetNotificationsQuery } from "./notification.interface";

export const getMyNotifications = async (
	userId: string,
	query: IGetNotificationsQuery,
) => {
	const { page, limit, isRead } = query;

	const skip = (page - 1) * limit;

	const where: {
		userId: string;
		isRead?: boolean;
	} = {
		userId,
	};

	if (isRead !== undefined) {
		where.isRead = isRead;
	}

	const [notifications, total] = await Promise.all([
		prisma.notification.findMany({
			where,
			skip,
			take: limit,
			orderBy: {
				createdAt: "desc",
			},
		}),

		prisma.notification.count({
			where,
		}),
	]);

	return {
		data: notifications,
		meta: {
			page,
			limit,
			total,
		},
	};
};

export const getMyNotificationById = async (
	userId: string,
	notificationId: string,
) => {
	const notification = await prisma.notification.findFirst({
		where: {
			id: notificationId,
			userId,
		},
	});

	if (!notification) {
		throw new AppError(404, "Notification not found.");
	}

	return notification;
};

export const markNotificationAsRead = async (
	userId: string,
	notificationId: string,
) => {
	const notification = await prisma.notification.findFirst({
		where: {
			id: notificationId,
			userId,
		},
	});

	if (!notification) {
		throw new AppError(404, "Notification not found.");
	}

	if (notification.isRead) {
		throw new AppError(400, "Notification is already marked as read.");
	}

	const updatedNotification = await prisma.notification.update({
		where: {
			id: notificationId,
		},
		data: {
			isRead: true,
		},
	});

	return updatedNotification;
};

export const markAllNotificationsAsRead = async (userId: string) => {
	const result = await prisma.notification.updateMany({
		where: {
			userId,
			isRead: false,
		},
		data: {
			isRead: true,
		},
	});

	return {
		updatedCount: result.count,
	};
};

export const getUnreadNotificationCount = async (userId: string) => {
	const count = await prisma.notification.count({
		where: {
			userId,
			isRead: false,
		},
	});

	return { count };
};
