import { Router } from "express";
import { auth } from "../../middlewares/auth.js";
import { Role } from "../../../generated/prisma/enums.js";
import validateRequest from "../../middlewares/validateRequest.js";
import {
  admissionFeeIdValidation,
  createAdmissionFeeValidation,
  updateAdmissionFeeValidation,
} from "./admissionFee.validation.js";
import * as admissionFeeController from "./admissionFee.controller.js";

const router = Router();

router.post(
  "/",
  auth(Role.SUPER_ADMIN),
  validateRequest(createAdmissionFeeValidation),
  admissionFeeController.createAdmissionFee,
);

router.get(
  "/",
  auth(Role.SUPER_ADMIN),
  admissionFeeController.getAllAdmissionFees,
);

router.get(
  "/:id",
  auth(Role.SUPER_ADMIN),
  validateRequest(admissionFeeIdValidation),
  admissionFeeController.getAdmissionFeeById,
);

router.patch(
  "/:id",
  auth(Role.SUPER_ADMIN),
  validateRequest(updateAdmissionFeeValidation),
  admissionFeeController.updateAdmissionFee,
);

router.delete(
  "/:id",
  auth(Role.SUPER_ADMIN),
  validateRequest(admissionFeeIdValidation),
  admissionFeeController.deleteAdmissionFee,
);

export const admissionFeeRoutes = router;
