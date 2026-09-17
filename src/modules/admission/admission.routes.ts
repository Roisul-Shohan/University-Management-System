import { Router } from "express";
import { Role } from "../../../generated/prisma/enums.js";
import { auth } from "../../middlewares/auth.js";
import validateRequest from "../../middlewares/validateRequest.js";
import * as admissionController from "./admission.controller.js";
import {
	admissionIdValidation,
	createAdmissionValidation,
	getAdmissionsValidation,
} from "./admission.validation.js";

const router = Router();

router.post(
	"/",
	auth(Role.STUDENT),
	validateRequest(createAdmissionValidation),
	admissionController.createAdmission,
);

router.patch(
	"/:admissionId/approve",
	auth(Role.SUPER_ADMIN, Role.TEACHER),
	validateRequest(admissionIdValidation),
	admissionController.approveAdmission,
);

router.patch(
	"/:admissionId/reject",
	auth(Role.SUPER_ADMIN, Role.TEACHER),
	validateRequest(admissionIdValidation),
	admissionController.rejectAdmission,
);

router.get("/my", auth(Role.STUDENT), admissionController.getMyAdmissions);

router.get(
	"/",
	auth(Role.SUPER_ADMIN, Role.TEACHER),
	validateRequest(getAdmissionsValidation),
	admissionController.getAdmissions,
);

router.get(
	"/:admissionId",
	auth(Role.STUDENT, Role.TEACHER, Role.SUPER_ADMIN),
	validateRequest(admissionIdValidation),
	admissionController.getAdmissionById,
);

export const admissionRoutes = router;
