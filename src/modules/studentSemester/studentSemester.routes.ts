import { Router } from "express";
import { auth } from "../../middlewares/auth.js";
import { Role } from "../../../generated/prisma/enums.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { initiateSemesterPaymentValidation } from "./studentSemester.validation.js";
import * as studentSemesterController from "./studentSemester.controller.js";

const router = Router();

router.post(
    "/:studentSemesterId/payment/initiate",
    auth(Role.STUDENT),
    validateRequest(initiateSemesterPaymentValidation),
    studentSemesterController.initiatePayment
);

router.post(
    "/:studentSemesterId/course-payment/initiate",
    auth(Role.STUDENT),
    validateRequest(initiateSemesterPaymentValidation),
    studentSemesterController.initiateCoursePayment
);

export const studentSemesterRoutes = router;
