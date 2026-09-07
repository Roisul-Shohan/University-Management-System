import { Router } from "express";
import {
	forgotPasswordController,
	getMeController,
	loginController,
	logoutController,
	refreshTokenController,
	register,
	resetPasswordController,
	verifyEmailController,
} from "./auth.controller.js";
import validateRequest from "../../middlewares/validateRequest.js";
import {
	forgotPasswordSchema,
	loginSchema,
	registerSchema,
	resetPasswordSchema,
	verifyEmailSchema,
} from "./auth.validation.js";
import { auth } from "../../middlewares/auth.js";
import { Role } from "../../../generated/prisma/enums.js";

const router = Router();

router.post("/register", validateRequest(registerSchema), register);

router.post(
	"/verify-email",
	validateRequest(verifyEmailSchema),
	verifyEmailController,
);

router.post("/login", validateRequest(loginSchema), loginController);

router.get(
	"/me",
	auth(Role.STUDENT, Role.SUPER_ADMIN, Role.TEACHER),
	getMeController,
);

router.post("/refresh-token", refreshTokenController);

router.post("/logout", logoutController);

router.post(
	"/forgot-password",
	validateRequest(forgotPasswordSchema),
	forgotPasswordController,
);

router.post(
	"/reset-password",
	validateRequest(resetPasswordSchema),
	resetPasswordController,
);

export const authRoutes = router;
