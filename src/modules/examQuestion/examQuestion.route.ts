import { Router } from "express";
import { Role } from "../../../generated/prisma/enums.js";
import { auth } from "../../middlewares/auth.js";
import validateRequest from "../../middlewares/validateRequest.js";
import * as controller from "./examQuestion.controller.js";
import {
	createExamQuestionValidation,
	examQuestionIdValidation,
	updateExamQuestionValidation,
} from "./examQuestion.validation.js";

const router = Router({ mergeParams: true });

router.get("/", auth(), controller.list);
router.post(
	"/",
	auth(Role.TEACHER, Role.SUPER_ADMIN),
	validateRequest(createExamQuestionValidation),
	controller.create,
);
router.patch(
	"/:questionId",
	auth(Role.TEACHER, Role.SUPER_ADMIN),
	validateRequest(updateExamQuestionValidation),
	controller.update,
);
router.delete(
	"/:questionId",
	auth(Role.TEACHER, Role.SUPER_ADMIN),
	validateRequest(examQuestionIdValidation),
	controller.remove,
);

export const examQuestionRoutes = router;
