/** biome-ignore-all assist/source/organizeImports: <explanation> */
import { Router } from "express";

import { auth } from "../../middlewares/auth.js";

import {
	getUsersQuerySchema,
	updateProfileSchema,
	updateUserStatusSchema,
} from "./users.validation.js";

import {
	getUserByIdController,
	getUsersController,
	updateProfileController,
	updateUserStatusController,
} from "./users.controller.js";

import { Role } from "../../../generated/prisma/enums.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { authorizeUserStatusChange } from "../../middlewares/authorizeUserStatusChange.js";

const router = Router();

router.get(
	"/",
	auth(Role.SUPER_ADMIN),
	validateRequest(getUsersQuerySchema),
	getUsersController,
);

router.get("/:id", auth(Role.SUPER_ADMIN), getUserByIdController);

router.patch(
	"/me",
	auth(Role.STUDENT, Role.SUPER_ADMIN, Role.TEACHER),
	validateRequest(updateProfileSchema),
	updateProfileController,
);

router.patch(
	"/:id/status",
	auth(Role.SUPER_ADMIN, Role.TEACHER),
	validateRequest(updateUserStatusSchema),
	authorizeUserStatusChange,
	updateUserStatusController,
);

export const usersRouter = router;
