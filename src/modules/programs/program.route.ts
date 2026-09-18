import { Router } from "express";
import { Role } from "../../../generated/prisma/enums.js";
import { auth } from "../../middlewares/auth.js";
import validateRequest from "../../middlewares/validateRequest.js";
import * as programController from "./program.controller.js";
import {
	createProgramValidation,
	programIdValidation,
	programsQueryValidation,
	updateProgramValidation,
} from "./program.validation.js";

const router = Router();

router.get(
	"/",
	auth(),
	validateRequest(programsQueryValidation),
	programController.getPrograms,
);

router.get(
	"/:id",
	auth(),
	validateRequest(programIdValidation),
	programController.getProgramById,
);

router.post(
	"/",
	auth(Role.TEACHER, Role.SUPER_ADMIN),
	validateRequest(createProgramValidation),
	programController.createProgram,
);

router.patch(
	"/:id",
	auth(Role.TEACHER, Role.SUPER_ADMIN),
	validateRequest(updateProgramValidation),
	programController.updateProgram,
);

router.delete(
	"/:id",
	auth(Role.TEACHER, Role.SUPER_ADMIN),
	validateRequest(programIdValidation),
	programController.deleteProgram,
);

export const programRoutes = router;
