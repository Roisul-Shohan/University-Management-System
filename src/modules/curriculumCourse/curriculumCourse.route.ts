import { Router } from "express";
import { Role } from "../../../generated/prisma/enums.js";
import { auth } from "../../middlewares/auth.js";
import validateRequest from "../../middlewares/validateRequest.js";
import * as curriculumCourseController from "./curriculumCourse.controller.js";
import {
  createCurriculumCourseValidation,
  curriculumCourseIdValidation,
  curriculumCoursesQueryValidation,
  updateCurriculumCourseValidation,
} from "./curriculumCourse.validation.js";

const router = Router();

router.get(
  "/",
  auth(),
  validateRequest(curriculumCoursesQueryValidation),
  curriculumCourseController.getCurriculumCourses,
);

router.get(
  "/:id",
  auth(),
  validateRequest(curriculumCourseIdValidation),
  curriculumCourseController.getCurriculumCourseById,
);

router.post(
  "/",
  auth(Role.TEACHER, Role.SUPER_ADMIN),
  validateRequest(createCurriculumCourseValidation),
  curriculumCourseController.createCurriculumCourse,
);

router.patch(
  "/:id",
  auth(Role.TEACHER, Role.SUPER_ADMIN),
  validateRequest(updateCurriculumCourseValidation),
  curriculumCourseController.updateCurriculumCourse,
);

router.delete(
  "/:id",
  auth(Role.TEACHER, Role.SUPER_ADMIN),
  validateRequest(curriculumCourseIdValidation),
  curriculumCourseController.deleteCurriculumCourse,
);

export const curriculumCourseRoutes = router;
