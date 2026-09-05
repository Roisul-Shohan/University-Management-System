import { Router } from "express";
import { register, verifyEmailController } from "./auth.controller";
import validateRequest from "../middlewares/validateRequest";
import { registerSchema, verifyEmailSchema } from "./auth.validation";

const router = Router();

router.post(
    "/register", 
    validateRequest(registerSchema),
    register
);

router.post( 
    "/verify-email", 
    validateRequest(verifyEmailSchema), 
    verifyEmailController
);

export const authRoutes=router;