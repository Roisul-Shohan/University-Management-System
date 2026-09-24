import { Router } from "express";
import { Role } from "../../../generated/prisma/enums.js";
import { auth } from "../../middlewares/auth.js";
import validateRequest from "../../middlewares/validateRequest.js";
import * as controller from "./attendance.controller.js";
import {
	attendanceSessionIdValidation,
	markAttendanceValidation,
	openAttendanceValidation,
	updateAttendanceRecordValidation,
} from "./attendance.validation.js";

const router = Router();

router.get(
	"/sessions/:id",
	auth(),
	validateRequest(attendanceSessionIdValidation),
	controller.get,
);
router.post(
	"/sessions",
	auth(Role.TEACHER, Role.SUPER_ADMIN),
	validateRequest(openAttendanceValidation),
	controller.open,
);
router.patch(
	"/sessions/:id/close",
	auth(Role.TEACHER, Role.SUPER_ADMIN),
	validateRequest(attendanceSessionIdValidation),
	controller.close,
);
router.post(
	"/sessions/:id/mark",
	auth(Role.STUDENT),
	validateRequest(markAttendanceValidation),
	controller.mark,
);
router.patch(
	"/sessions/:sessionId/records/:recordId",
	auth(Role.TEACHER, Role.SUPER_ADMIN),
	validateRequest(updateAttendanceRecordValidation),
	controller.updateRecord,
);

export const attendanceRoutes = router;
