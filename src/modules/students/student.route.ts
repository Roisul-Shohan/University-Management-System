import { Router } from "express";

import { auth } from "../../middlewares/auth.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { Role } from "../../../generated/prisma/enums.js";
import * as studentController from "./student.controller.js";
import {
	createStudentValidation,
	getStudentValidation,
	getStudentsValidation,
} from "./student.validation.js";

const router = Router();


// Student views own profile
router.get("/me", auth(Role.STUDENT), studentController.getMyStudentProfile);

// Admin/Teacher views all students
router.get(
	"/",
	auth(Role.SUPER_ADMIN, Role.TEACHER),
	validateRequest(getStudentsValidation),
	studentController.getStudents,
);

// Admin/Teacher views a specific student
router.get(
	"/:studentId",
	auth(Role.SUPER_ADMIN, Role.TEACHER),
	validateRequest(getStudentValidation),
	studentController.getStudent,
);

export const studentRoutes = router;