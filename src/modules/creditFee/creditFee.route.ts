import { Router } from "express";
import { auth } from "../../middlewares/auth.js";
import { Role } from "../../../generated/prisma/enums.js";
import validateRequest from "../../middlewares/validateRequest.js";
import {
  createCreditFeeValidation,
  creditFeeIdValidation,
  updateCreditFeeValidation,
} from "./creditFee.validation.js";
import * as creditFeeController from "./creditFee.controller.js";

const router = Router();

router.post(
  "/",
  auth(Role.SUPER_ADMIN),
  validateRequest(createCreditFeeValidation),
  creditFeeController.createCreditFee,
);

router.get("/", auth(Role.SUPER_ADMIN), creditFeeController.getAllCreditFees);

router.get(
  "/:id",
  auth(Role.SUPER_ADMIN),
  validateRequest(creditFeeIdValidation),
  creditFeeController.getCreditFeeById,
);

router.patch(
  "/:id",
  auth(Role.SUPER_ADMIN),
  validateRequest(updateCreditFeeValidation),
  creditFeeController.updateCreditFee,
);

router.delete(
  "/:id",
  auth(Role.SUPER_ADMIN),
  validateRequest(creditFeeIdValidation),
  creditFeeController.deleteCreditFee,
);

export const creditFeeRoutes = router;
export const courseRegistrationFeeRoutes = router;
