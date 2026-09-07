/** biome-ignore-all assist/source/organizeImports: <explanation> */
import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import {
	createAcademicPeriodSchema,
	getAcademicPeriodByIdSchema,
	getAcademicPeriodsQuerySchema,
	updateAcademicPeriodRequestSchema,
	updateAcademicPeriodSchema,
	updateAcademicPeriodStatusSchema,
} from "./academicPeriod.validation";
import validateRequest from "../../middlewares/validateRequest";
import {
	createAcademicPeriodController,
	getAcademicPeriodByIdController,
	getAcademicPeriodsController,
	getCurrentAcademicPeriodsController,
	updateAcademicPeriodController,
	updateAcademicPeriodStatusController,
} from "./academicPeriod.controller";

const router = Router();

router.post(
	"/",
	auth(Role.SUPER_ADMIN),
	validateRequest(createAcademicPeriodSchema),
	createAcademicPeriodController,
);

router.get(
	"/",
	auth(Role.SUPER_ADMIN),
	validateRequest(getAcademicPeriodsQuerySchema),
	getAcademicPeriodsController,
);

router.get(
	"/:id",
	auth(Role.SUPER_ADMIN),
	validateRequest(getAcademicPeriodByIdSchema),
	getAcademicPeriodByIdController,
);

router.patch(
	"/:id",
	auth(Role.SUPER_ADMIN),
	validateRequest(getAcademicPeriodByIdSchema),
	validateRequest(updateAcademicPeriodRequestSchema),
	updateAcademicPeriodController,
);

router.patch(
	"/:id/status",
	auth(Role.SUPER_ADMIN),
	validateRequest(updateAcademicPeriodStatusSchema),
	updateAcademicPeriodStatusController,
);

router.get("/current", getCurrentAcademicPeriodsController);

export const academicPeriodRouter = router;
