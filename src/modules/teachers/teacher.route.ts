import { Router } from "express";
import { Role } from "../../../generated/prisma/enums.js";
import { auth } from "../../middlewares/auth.js";
import validateRequest from "../../middlewares/validateRequest.js";
import * as teacherController from "./teacher.controller.js";
import {
  applyTeacherValidation,
  rejectTeacherApplicationValidation,
  teacherApplicationIdValidation,
  teacherApplicationsQueryValidation,
} from "./teacher.validation.js";

const router = Router();

router.post(
  "/apply",
  auth(Role.TEACHER),
  validateRequest(applyTeacherValidation),
  teacherController.applyAsTeacher,
);

router.get(
  "/applications/me",
  auth(Role.TEACHER),
  teacherController.getMyTeacherApplication,
);

router.get("/me", auth(Role.TEACHER), teacherController.getMyTeacherProfile);

router.get(
  "/applications",
  auth(Role.TEACHER, Role.SUPER_ADMIN),
  validateRequest(teacherApplicationsQueryValidation),
  teacherController.getTeacherApplications,
);

router.patch(
  "/applications/:id/approve",
  auth(Role.TEACHER, Role.SUPER_ADMIN),
  validateRequest(teacherApplicationIdValidation),
  teacherController.approveTeacherApplication,
);

router.patch(
  "/applications/:id/reject",
  auth(Role.TEACHER, Role.SUPER_ADMIN),
  validateRequest(rejectTeacherApplicationValidation),
  teacherController.rejectTeacherApplication,
);

export const teacherRoutes = router;
