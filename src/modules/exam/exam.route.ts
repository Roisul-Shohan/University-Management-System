import { Router } from "express";
import { Role } from "../../../generated/prisma/enums.js";
import { auth } from "../../middlewares/auth.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { examQuestionRoutes } from "../examQuestion/examQuestion.route.js";
import * as controller from "./exam.controller.js";
import {
	createExamValidation,
	examIdValidation,
	examsQueryValidation,
	updateExamValidation,
} from "./exam.validation.js";

const router = Router();

router.use("/:examId/questions", examQuestionRoutes);

router.get("/", auth(), validateRequest(examsQueryValidation), controller.list);
router.get("/:id", auth(), validateRequest(examIdValidation), controller.get);
router.post(
	"/",
	auth(Role.TEACHER, Role.SUPER_ADMIN),
	validateRequest(createExamValidation),
	controller.create,
);
router.patch(
	"/:id",
	auth(Role.TEACHER, Role.SUPER_ADMIN),
	validateRequest(updateExamValidation),
	controller.update,
);
router.patch(
	"/:id/publish",
	auth(Role.TEACHER, Role.SUPER_ADMIN),
	validateRequest(examIdValidation),
	controller.publish,
);
router.patch(
	"/:id/close",
	auth(Role.TEACHER, Role.SUPER_ADMIN),
	validateRequest(examIdValidation),
	controller.close,
);
router.delete(
	"/:id",
	auth(Role.TEACHER, Role.SUPER_ADMIN),
	validateRequest(examIdValidation),
	controller.remove,
);

export const examRoutes = router;
