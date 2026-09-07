/** biome-ignore-all assist/source/organizeImports: <explanation> */
import { Router } from "express";

import {
	getMyNotificationByIdController,
	getMyNotificationsController,
	getUnreadNotificationCountController,
	markAllNotificationsAsReadController,
	markNotificationAsReadController,
} from "./notification.controller.js";
import {
	getNotificationByIdSchema,
	getNotificationsQuerySchema,
	markNotificationAsReadSchema,
} from "./notification.validation.js";
import { auth } from "../../middlewares/auth.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { Role } from "../../../generated/prisma/enums.js";

const router = Router();

router.get(
	"/",
	auth(Role.STUDENT, Role.TEACHER, Role.SUPER_ADMIN),
	validateRequest(getNotificationsQuerySchema),
	getMyNotificationsController,
);

router.get(
	"/:id",
	auth(Role.STUDENT, Role.TEACHER, Role.SUPER_ADMIN),
	validateRequest(getNotificationByIdSchema),
	getMyNotificationByIdController,
);

router.patch(
	"/:id/read",
	auth(Role.STUDENT, Role.TEACHER, Role.SUPER_ADMIN),
	validateRequest(markNotificationAsReadSchema),
	markNotificationAsReadController,
);

router.patch(
	"/read-all",
	auth(Role.STUDENT, Role.TEACHER, Role.SUPER_ADMIN),
	markAllNotificationsAsReadController,
);

router.get(
	"/unread-count",
	auth(Role.STUDENT, Role.TEACHER, Role.SUPER_ADMIN),
	getUnreadNotificationCountController,
);

export const notificationRouter = router;
