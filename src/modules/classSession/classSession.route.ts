import { Router } from "express";
import { Role } from "../../../generated/prisma/enums.js";
import { auth } from "../../middlewares/auth.js";
import validateRequest from "../../middlewares/validateRequest.js";
import * as controller from "./classSession.controller.js";
import {
	classSessionIdValidation,
	classSessionsQueryValidation,
	createClassSessionValidation,
	updateClassSessionValidation,
} from "./classSession.validation.js";

const router = Router();

router.get(
	"/",
	auth(),
	validateRequest(classSessionsQueryValidation),
	controller.list,
);
router.get(
	"/:id",
	auth(),
	validateRequest(classSessionIdValidation),
	controller.getById,
);
router.post(
	"/",
	auth(Role.TEACHER, Role.SUPER_ADMIN),
	validateRequest(createClassSessionValidation),
	controller.create,
);
router.patch(
	"/:id",
	auth(Role.TEACHER, Role.SUPER_ADMIN),
	validateRequest(updateClassSessionValidation),
	controller.update,
);
router.delete(
	"/:id",
	auth(Role.TEACHER, Role.SUPER_ADMIN),
	validateRequest(classSessionIdValidation),
	controller.remove,
);

export const classSessionRoutes = router;
