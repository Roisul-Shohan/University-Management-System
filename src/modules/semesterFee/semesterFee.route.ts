import { Router } from "express";
import { auth } from "../../middlewares/auth.js";
import { Role } from "../../../generated/prisma/enums.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { createSemesterFeeValidation, updateSemesterFeeValidation } from "./semesterFee.validation.js";
import * as semesterFeeController from "./semesterFee.controller.js";

const router = Router();

router.post(
    "/",
    auth(Role.SUPER_ADMIN),
    validateRequest(createSemesterFeeValidation),
    semesterFeeController.createSemesterFee
);

router.get(
    "/",
    auth(Role.SUPER_ADMIN),
    semesterFeeController.getAllSemesterFees
);

router.patch(
    "/:id",
    auth(Role.SUPER_ADMIN),
    validateRequest(updateSemesterFeeValidation),
    semesterFeeController.updateSemesterFee
);

router.delete(
    "/:id",
    auth(Role.SUPER_ADMIN),
    semesterFeeController.deleteSemesterFee
);

export const semesterFeeRoutes = router;
