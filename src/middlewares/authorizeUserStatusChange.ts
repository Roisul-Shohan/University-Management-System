import { Request, Response, NextFunction } from "express";
import { Role } from "../../generated/prisma/client.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../errors/AppErrors.js";
import { prisma } from "../lib/prisma.js";

export const authorizeUserStatusChange = catchAsync(
	async (req: Request, res: Response, next: NextFunction) => {
		const currentUser = req.user!;

		// Super Admin can manage anyone
		if (currentUser.role === Role.SUPER_ADMIN) {
			return next();
		}

		// Only teachers can be Department Admins
		if (currentUser.role !== Role.TEACHER) {
			throw new AppError(403, "You are not authorized to change user status.");
		}

		const teacher = await prisma.teacher.findUnique({
			where: {
				id: currentUser.userId,
			},
			select: {
				isDeptAdmin: true,
				departmentId: true,
			},
		});

		if (!teacher || !teacher.isDeptAdmin) {
			throw new AppError(403, "You are not authorized to change user status.");
		}

		// Find the target user's department
		const targetUser = await prisma.user.findUnique({
			where: {
				id: req.params.id as string,
			},
			select: {
				role: true,
				student: {
					select: {
						program: {
							select: {
								departmentId: true,
							},
						},
					},
				},
				teacher: {
					select: {
						departmentId: true,
						isDeptAdmin: true,
					},
				},
			},
		});

		if (!targetUser) {
			throw new AppError(404, "User not found.");
		}

		if (targetUser.role === Role.TEACHER && targetUser.teacher?.isDeptAdmin) {
			throw new AppError(
				403,
				"Department Admin cannot modify another Department Admin.",
			);
		}

		if (targetUser.role === Role.SUPER_ADMIN) {
			throw new AppError(403, "Department Admin cannot modify a Super Admin.");
		}

		let targetDepartmentId: string | undefined;

		if (targetUser.role === Role.STUDENT) {
			targetDepartmentId = targetUser.student?.program.departmentId;
		}

		if (targetUser.role === Role.TEACHER) {
			targetDepartmentId = targetUser.teacher?.departmentId;
		}

		if (!targetDepartmentId) {
			throw new AppError(403, "This user does not belong to a department.");
		}

		if (targetDepartmentId !== teacher.departmentId) {
			throw new AppError(
				403,
				"You can only manage users from your own department.",
			);
		}

		next();
	},
);
