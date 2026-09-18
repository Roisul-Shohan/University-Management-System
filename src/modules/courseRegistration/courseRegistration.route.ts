import { Router } from "express";
import { Role } from "../../../generated/prisma/enums.js";
import { auth } from "../../middlewares/auth.js";
import validateRequest from "../../middlewares/validateRequest.js";
import * as controller from "./courseRegistration.controller.js";
import {
  registerCourseValidation,
  studentSemesterParamsValidation,
} from "./courseRegistration.validation.js";

const router = Router();

router.use(auth(Role.STUDENT));
router.get(
  "/:studentSemesterId/offerings",
  validateRequest(studentSemesterParamsValidation),
  controller.getAvailableCourses,
);
router.post(
  "/:studentSemesterId/courses",
  validateRequest(registerCourseValidation),
  controller.registerCourse,
);
router.delete(
  "/:studentSemesterId/courses/:courseOfferingId",
  validateRequest(
    studentSemesterParamsValidation.extend({
      params: studentSemesterParamsValidation.shape.params.extend({
        courseOfferingId:
          registerCourseValidation.shape.params.shape.studentSemesterId,
      }),
    }),
  ),
  controller.dropCourse,
);

export const courseRegistrationRoutes = router;
