import { Router } from "express";
import { auth } from "../../middlewares/auth.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { Role } from "../../../generated/prisma/enums.js";
import * as paymentController from "./payment.controller.js";
import {
	createAdmissionPaymentValidation,
	executePaymentValidation,
	getPaymentStatusValidation,
} from "./payment.validation.js";

const router = Router();

router.post(
	"/admission/:admissionId",
	auth(Role.STUDENT),
	validateRequest(createAdmissionPaymentValidation),
	paymentController.createAdmissionPayment,
);

router.post(
	"/bkash/execute",
	auth(Role.STUDENT),
	validateRequest(executePaymentValidation),
	paymentController.executePayment,
);

router.get(
	"/:transactionId/status",
	auth(Role.STUDENT),
	validateRequest(getPaymentStatusValidation),
	paymentController.getPaymentStatus,
);

export default router;
