import { Router } from "express";
import { Role } from "../../../generated/prisma/enums.js";
import { auth } from "../../middlewares/auth.js";
import validateRequest from "../../middlewares/validateRequest.js";
import * as courseController from "./course.controller.js";
import {
  courseIdValidation,
  coursesQueryValidation,
  createCourseValidation,
  updateCourseValidation,
} from "./course.validation.js";

const router = Router();

router.get(
  "/",
  auth(),
  validateRequest(coursesQueryValidation),
  courseController.getCourses,
);

router.get(
  "/:id",
  auth(),
  validateRequest(courseIdValidation),
  courseController.getCourseById,
);

router.post(
  "/",
  auth(Role.TEACHER, Role.SUPER_ADMIN),
  validateRequest(createCourseValidation),
  courseController.createCourse,
);

router.patch(
  "/:id",
  auth(Role.TEACHER, Role.SUPER_ADMIN),
  validateRequest(updateCourseValidation),
  courseController.updateCourse,
);

router.delete(
  "/:id",
  auth(Role.TEACHER, Role.SUPER_ADMIN),
  validateRequest(courseIdValidation),
  courseController.deleteCourse,
);

export const courseRoutes = router;
