/** biome-ignore-all assist/source/organizeImports: <explanation> */
import { Router } from "express";


import * as departmentController from "./department.controller.js";
import {
	createDepartmentSchema,
	departmentIdSchema,
	updateDepartmentSchema,
} from "./department.validation.js";
import { auth } from "../../middlewares/auth.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { Role } from "../../../generated/prisma/enums.js";

const router = Router();

router.post(
	"/",
	auth(Role.SUPER_ADMIN),
	validateRequest(createDepartmentSchema),
	departmentController.createDepartment,
);

router.get(
	"/",
	auth(),
	departmentController.getAllDepartments,
);

router.get(
	"/:id",
	auth(),
	validateRequest(departmentIdSchema),
	departmentController.getDepartmentById,
);

router.patch(
	"/:id",
	auth(Role.SUPER_ADMIN),
	validateRequest(updateDepartmentSchema),
	departmentController.updateDepartment,
);

router.delete(
	"/:id",
	auth(Role.SUPER_ADMIN),
	validateRequest(departmentIdSchema),
	departmentController.deleteDepartment,
);

export const departmentRouter = router;