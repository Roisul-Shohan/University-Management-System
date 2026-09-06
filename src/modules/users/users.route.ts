/** biome-ignore-all assist/source/organizeImports: <explanation> */
import { Router } from "express";

import { auth } from "../../middlewares/auth";

import {
	getUsersQuerySchema,
	updateProfileSchema,
	updateUserStatusSchema,
} from "./users.validation";

import {
	getUserByIdController,
	getUsersController,
	updateProfileController,
	updateUserStatusController,
} from "./users.controller";

import { Role } from "../../../generated/prisma/enums";
import validateRequest from "../../middlewares/validateRequest";
import { authorizeUserStatusChange } from "../../middlewares/authorizeUserStatusChange";

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
