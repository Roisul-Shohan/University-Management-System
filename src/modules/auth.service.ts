/** biome-ignore-all lint/style/useNodejsImportProtocol: <explanation> */
import bcrypt from "bcryptjs";
import { JwtPayload } from "jsonwebtoken";
import {
	LoginUserInput,
	PendingRegistration,
	RegisterUserInput,
	ResetPasswordInput,
	VerifyEmailInput,
} from "./auth.interface";
import { prisma } from "../lib/prisma";
import AppError from "../errors/AppErrors";
import { redisClient } from "../lib/redis";
import { randomInt } from "crypto";
import { sendPasswordResetEmail, sendVerificationEmail } from "../utils/email";
import { jwtUtils } from "../utils/jwt";
import config from "../config";

const OTP_EXPIRATION = 4 * 60; // 4 minutes

export const registerUser = async (data: RegisterUserInput) => {
	const { name, email, password, role } = data;

	const existingUser = await prisma.user.findUnique({
		where: {
			email,
		},
	});

	if (existingUser) {
		throw new AppError(409, "An account with this email already exists.");
	}

	// 2. Hash password
	const hashed_password = await bcrypt.hash(password, 12);

	// 4. Generate OTP
	const otp = randomInt(100000, 1000000).toString();

	const otpHash = await bcrypt.hash(otp, 10);

	// 5. Store pending registration in Redis
	const redisKey = `email-verification:${email}`;

	const pendingRegistration = {
		name,
		email,
		hashed_password,
		role,
		otpHash,
	};

	await redisClient.set(redisKey, JSON.stringify(pendingRegistration), {
		expiration: {
			type: "EX",
			value: OTP_EXPIRATION,
		},
	});

	await sendVerificationEmail(email, name, otp);

	return {
		message:
			"Registration initiated. Please check your email for the verification code.",
	};
};

export const verifyEmail = async (data: VerifyEmailInput) => {
	const { email, otp } = data;

	const redisKey = `email-verification:${email}`;
	const lockKey = `email-verification-lock:${email}`;

	// Acquire lock for this email
	const lockAcquired = await redisClient.set(lockKey, "1", {
		expiration: {
			type: "EX",
			value: 30,
		},
		condition: "NX",
	});

	// Another verification request is already processing
	if (!lockAcquired) {
		throw new AppError(
			429,
			"Verification is already being processed. Please try again.",
		);
	}

	try {
		// Check if user already exists
		const existingUser = await prisma.user.findUnique({
			where: { email },
		});

		if (existingUser) {
			throw new AppError(409, "An account with this email already exists.");
		}

		//Get pending registration from Redis
		const storedData = await redisClient.get(redisKey);

		if (!storedData) {
			throw new AppError(
				400,
				"Verification code has expired or registration was not found.",
			);
		}

		const pendingRegistration = JSON.parse(storedData) as PendingRegistration;

		//Compare OTP with stored hash
		const otpMatched = await bcrypt.compare(otp, pendingRegistration.otpHash);

		if (!otpMatched) {
			throw new AppError(400, "Invalid verification code.");
		}

		// Create user after successful verification
		const user = await prisma.user.create({
			data: {
				name: pendingRegistration.name,
				email: pendingRegistration.email,
				password: pendingRegistration.hashed_password,
				role: pendingRegistration.role,
			},

			select: {
				id: true,
				name: true,
				email: true,
				role: true,
				createdAt: true,
			},
		});

		// Remove pending registration
		await redisClient.del(redisKey);

		return user;
	} finally {
		// Always release the lock
		await redisClient.del(lockKey);
	}
};

export const loginUser = async (data: LoginUserInput) => {
	const { email, password } = data;

	// Find user
	const user = await prisma.user.findUnique({
		where: { email },
	});

	if (!user) {
		throw new AppError(401, "Invalid email or password.");
	}

	// Check account status
	if (user.status !== "ACTIVE") {
		throw new AppError(403, "Your account is not active.");
	}

	// Compare password with stored hash
	const passwordMatched = await bcrypt.compare(password, user.password);

	if (!passwordMatched) {
		throw new AppError(401, "Invalid email or password.");
	}

	return {
		id: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
	};
};

export const getMe = async (userId: string) => {
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

export const refreshAccessToken = async (refreshToken: string) => {
	const result = jwtUtils.verifyToken(refreshToken, config.jwt_refresh_secret!);

	if (!result.success) {
		throw new AppError(401, "Invalid or expired refresh token.");
	}

	const decoded = result.data as JwtPayload;

	const { userId, tokenType } = decoded;

	if (!userId || tokenType !== "refresh") {
		throw new AppError(401, "Invalid refresh token.");
	}

	const user = await prisma.user.findUnique({
		where: {
			id: userId,
		},
	});

	if (!user) {
		throw new AppError(404, "User not found.");
	}

	if (user.status !== "ACTIVE") {
		throw new AppError(403, "Your account is not active.");
	}

	return user;
};

export const forgotPassword = async (email: string) => {
	const user = await prisma.user.findUnique({
		where: {
			email,
		},
	});

	if (!user) {
		return;
	}

	if (user.status !== "ACTIVE") {
		return;
	}

	const otp = randomInt(100000, 1000000).toString();

	const otpHash = await bcrypt.hash(otp, 10);

	const redisKey = `password-reset:${email}`;

	const resetData = {
		email,
		otpHash,
	};

	await redisClient.set(redisKey, JSON.stringify(resetData), {
		expiration: {
			type: "EX",
			value: 10 * 60,
		},
	});

	await sendPasswordResetEmail(email, user.name, otp);
};

export const resetPassword = async (data: ResetPasswordInput) => {
	const { email, otp, newPassword } = data;

	const redisKey = `password-reset:${email}`;
	const lockKey = `password-reset-lock:${email}`;

	const lockAcquired = await redisClient.set(lockKey, "1", {
		expiration: {
			type: "EX",
			value: 30,
		},
		condition: "NX",
	});

	if (!lockAcquired) {
		throw new AppError(
			429,
			"Password reset is already being processed. Please try again.",
		);
	}

	try {
		const storedData = await redisClient.get(redisKey);

		if (!storedData) {
			throw new AppError(
				400,
				"Password reset code has expired or was not found.",
			);
		}

		const resetData = JSON.parse(storedData) as {
			email: string;
			otpHash: string;
		};

		const otpMatched = await bcrypt.compare(otp, resetData.otpHash);

		if (!otpMatched) {
			throw new AppError(400, "Invalid password reset code.");
		}

		const user = await prisma.user.findUnique({
			where: {
				email,
			},
		});

		if (!user) {
			throw new AppError(404, "User not found.");
		}

		const passwordHash = await bcrypt.hash(newPassword, 12);

		await prisma.user.update({
			where: {
				id: user.id,
			},
			data: {
				passwordHash,
			},
		});

		await redisClient.del(redisKey);
	} finally {
		await redisClient.del(lockKey);
	}
};
