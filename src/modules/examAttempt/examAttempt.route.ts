import { Router } from "express";
import { Role } from "../../../generated/prisma/enums.js";
import { auth } from "../../middlewares/auth.js";
import validateRequest from "../../middlewares/validateRequest.js";
import * as controller from "./examAttempt.controller.js";
import {
	examAttemptExamIdValidation,
	examAttemptIdValidation,
	submitExamAttemptValidation,
} from "./examAttempt.validation.js";

const router = Router();

router.post(
	"/exams/:examId/start",
	auth(Role.STUDENT),
	validateRequest(examAttemptExamIdValidation),
	controller.start,
);
router.get(
	"/attempts/:attemptId",
	auth(Role.STUDENT),
	validateRequest(examAttemptIdValidation),
	controller.get,
);
router.post(
	"/attempts/:attemptId/submit",
	auth(Role.STUDENT),
	validateRequest(submitExamAttemptValidation),
	controller.submit,
);

export const examAttemptRoutes = router;
