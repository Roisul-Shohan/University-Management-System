/** biome-ignore-all lint/style/useImportType: <explanation> */
import bcrypt from "bcryptjs";
import { PrismaClient } from "../../../generated/prisma/client";
import AppError from "../../errors/AppErrors";
import { prisma } from "../../lib/prisma";
import { GetUsersQuery, UpdateProfileInput } from "./users.interface";

export const getUsers = async (query: GetUsersQuery) => {
	const { page, limit, search, role, status, sortBy, sortOrder } = query;

	const skip = (page - 1) * limit;

	// OR conditions → searching
	const OR = [];

	if (search) {
		OR.push(
			{
				name: {
					contains: search,
					mode: "insensitive" as const,
				},
			},
			{
				email: {
					contains: search,
					mode: "insensitive" as const,
				},
			},
		);
	}

	// AND conditions → filtering
	const AND = [];

	if (role) {
		AND.push({
			role,
		});
	}

	if (status) {
		AND.push({
			status,
		});
	}

	const whereCondition = {
		AND,
		OR,
	};

	const [users, total] = await Promise.all([
		prisma.user.findMany({
			where: whereCondition,
			skip,
			take: limit,

			omit: {
				password: true,
			},

			orderBy: {
				[sortBy]: sortOrder,
			},
		}),

		prisma.user.count({
			where: whereCondition,
		}),
	]);

	return {
		users,
		meta: {
			page,
			limit,
			total,
		},
	};
};
export const getUserById = async (userId: string) => {
	const user = await prisma.user.findUnique({
		where: {
			id: userId,
		},
		omit: {
			password: true,
		},
	});

	if (!user) {
		throw new AppError(404, "User not found.");
	}

	return user;
};

export const updateProfile = async (
	userId: string,
	data: UpdateProfileInput,
) => {
	const user = await prisma.user.findUnique({
		where: {
			id: userId,
		},
	});

	if (!user) {
		throw new AppError(404, "User not found.");
	}

	const updateData: {
		name?: string;
		address?: string;
		email?: string;
		password?: string;
	} = {};

	if (data.name !== undefined) {
		updateData.name = data.name;
	}

	if (data.address !== undefined) {
		updateData.address = data.address;
	}

	if (data.email !== undefined) {
		if (data.email !== user.email) {
			const existingUser = await prisma.user.findUnique({
				where: {
					email: data.email,
				},
			});

			if (existingUser) {
				throw new AppError(409, "An account with this email already exists.");
			}

			updateData.email = data.email;
		}
	}

	if (data.password !== undefined) {
		updateData.password = await bcrypt.hash(data.password, 12);
	}

	const updatedUser = await prisma.user.update({
		where: {
			id: userId,
		},
		data: updateData,
		omit: {
			password: true,
		},
	});

	return updatedUser;
};

export const updateUserStatus = async (
	userId: string,
	status: "ACTIVE" | "SUSPENDED" | "DISABLED",
) => {
	const user = await prisma.user.findUnique({
		where: {
			id: userId,
		},
	});

	if (!user) {
		throw new AppError(404, "User not found.");
	}

	const updatedUser = await prisma.user.update({
		where: {
			id: userId,
		},
		data: {
			status,
		},
		omit: {
			password: true,
		},
	});

	return updatedUser;
};
