import { Router } from "express";
import { Role } from "../../../generated/prisma/enums.js";
import { auth } from "../../middlewares/auth.js";
import validateRequest from "../../middlewares/validateRequest.js";
import * as controller from "./courseOffering.controller.js";
import {
	courseOfferingIdValidation,
	courseOfferingsQueryValidation,
	createCourseOfferingValidation,
	updateCourseOfferingValidation,
} from "./courseOffering.validation.js";

const router = Router();

router.get(
	"/",
	auth(),
	validateRequest(courseOfferingsQueryValidation),
	controller.list,
);
router.get(
	"/:id",
	auth(),
	validateRequest(courseOfferingIdValidation),
	controller.getById,
);
router.post(
	"/",
	auth(Role.TEACHER, Role.SUPER_ADMIN),
	validateRequest(createCourseOfferingValidation),
	controller.create,
);
router.patch(
	"/:id",
	auth(Role.TEACHER, Role.SUPER_ADMIN),
	validateRequest(updateCourseOfferingValidation),
	controller.update,
);
router.delete(
	"/:id",
	auth(Role.TEACHER, Role.SUPER_ADMIN),
	validateRequest(courseOfferingIdValidation),
	controller.remove,
);

export const courseOfferingRoutes = router;
