import { Request, Response } from "express";
import {
	forgotPassword,
	getMe,
	loginUser,
	refreshAccessToken,
	registerUser,
	resetPassword,
	verifyEmail,
} from "./auth.service";
import catchAsync from "../../utils/catchAsync";
import { jwtUtils } from "../../utils/jwt";
import config from "../../config";
import sendResponse from "../../utils/sendResponse";
import AppError from "../../errors/AppErrors";

export const register = catchAsync(async (req: Request, res: Response) => {
	const result = await registerUser(req.body);

	sendResponse(res, {
		statusCode: 201,
		success: true,
		message: result.message,
		data: {},
	});
});

export const verifyEmailController = catchAsync(
	async (req: Request, res: Response) => {
		const user = await verifyEmail(req.body);

		const jwtPayload = {
			userId: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
		};

		// Create access token
		const accessToken = jwtUtils.createToken(
			{
				...jwtPayload,
				tokenType: "access",
			},
			config.jwt_access_secret!,
			config.jwt_access_expires_in,
		);

		const refreshToken = jwtUtils.createToken(
			{
				...jwtPayload,
				tokenType: "refresh",
			},
			config.jwt_refresh_secret!,
			config.jwt_refresh_expires_in,
		);
		res.cookie("accessToken", accessToken, {
			httpOnly: true,
			secure: config.node_env === "production",
			sameSite: "lax",
			maxAge: 15 * 60 * 1000,
		});

		res.cookie("refreshToken", refreshToken, {
			httpOnly: true,
			secure: config.node_env === "production",
			sameSite: "lax",
			maxAge: 7 * 24 * 60 * 60 * 1000,
		});

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Email verified successfully.",
			data: {
				user,
			},
		});
	},
);

export const loginController = catchAsync(
	async (req: Request, res: Response) => {
		const user = await loginUser(req.body);

		const jwtPayload = {
			userId: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
		};

		// Create access token
		const accessToken = jwtUtils.createToken(
			{
				...jwtPayload,
				tokenType: "access",
			},
			config.jwt_access_secret!,
			config.jwt_access_expires_in,
		);

		// Create refresh token
		const refreshToken = jwtUtils.createToken(
			{
				...jwtPayload,
				tokenType: "refresh",
			},
			config.jwt_refresh_secret!,
			config.jwt_refresh_expires_in,
		);

		res.cookie("accessToken", accessToken, {
			httpOnly: true,
			secure: config.node_env === "production",
			sameSite: "lax",
			maxAge: 15 * 60 * 1000,
		});

		res.cookie("refreshToken", refreshToken, {
			httpOnly: true,
			secure: config.node_env === "production",
			sameSite: "lax",
			maxAge: 7 * 24 * 60 * 60 * 1000,
		});

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Login successful.",
			data: {
				user,
				accessToken,
				refreshToken,
			},
		});
	},
);

export const getMeController = catchAsync(
	async (req: Request, res: Response) => {
		const user = await getMe(req.user!.userId);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "User information retrieved successfully.",
			data: user,
		});
	},
);

export const refreshTokenController = catchAsync(
	async (req: Request, res: Response) => {
		const refreshToken = req.cookies?.refreshToken;

		if (!refreshToken) {
			throw new AppError(401, "Refresh token not provided.");
		}

		const user = await refreshAccessToken(refreshToken);

		const jwtPayload = {
			userId: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			tokenType: "access",
		};

		const accessToken = jwtUtils.createToken(
			jwtPayload,
			config.jwt_access_secret!,
			config.jwt_access_expires_in,
		);

		res.cookie("accessToken", accessToken, {
			httpOnly: true,
			secure: config.node_env === "production",
			sameSite: "lax",
			maxAge: 15 * 60 * 1000,
		});

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Access token refreshed successfully.",
			data: {
				user: {
					id: user.id,
					name: user.name,
					email: user.email,
					role: user.role,
					status: user.status,
					createdAt: user.createdAt,
					updatedAt: user.updatedAt,
				},
			},
		});
	},
);

export const logoutController = catchAsync(
	async (req: Request, res: Response) => {
		res.clearCookie("accessToken", {
			httpOnly: true,
			secure: config.node_env === "production",
			sameSite: "lax",
		});

		res.clearCookie("refreshToken", {
			httpOnly: true,
			secure: config.node_env === "production",
			sameSite: "lax",
		});

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Logout successful.",
			data: {},
		});
	},
);

export const forgotPasswordController = catchAsync(
	async (req: Request, res: Response) => {
		await forgotPassword(req.body.email);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message:
				"If an account exists with this email, a password reset code has been sent.",
			data: {},
		});
	},
);

export const resetPasswordController = catchAsync(
	async (req: Request, res: Response) => {
		await resetPassword(req.body);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Password reset successfully.",
			data: {},
		});
	},
);
