import AppError from "../errors/AppErrors.js";
import config from "../config/index.js";
import { redisClient } from "./redis.js";

export const getBkashIdToken = async () => {
	try {
		const IdTokenKey = "bkash:idToken";
		const RefreshTokenKey = "bkash:refreshToken";

		let bkashIdToken = await redisClient.get(IdTokenKey);
		const bkashIdTokenTTL = await redisClient.ttl(IdTokenKey);

		const bkashRefreshToken = await redisClient.get(RefreshTokenKey);
		const bkashRefreshTokenTTL = await redisClient.ttl(RefreshTokenKey);

		if (
			(bkashIdTokenTTL <= 600 || !bkashIdToken) &&
			bkashRefreshToken &&
			bkashRefreshTokenTTL > 600
		) {
			const refreshTokenResponse = await fetch(
				`${config.bkash_base_url}/tokenized/checkout/token/refresh`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json",
						username: config.bkash_username!,
						password: config.bkash_password!,
					},
					body: JSON.stringify({
						app_key: config.bkash_app_key,
						app_secret: config.bkash_app_secret,
						refresh_token: bkashRefreshToken,
					}),
				},
			);
			if (!refreshTokenResponse.ok) {
				throw new AppError(500, "Bkash Access Token Refresh Failed");
			}

			const bkashRefreshTokenResult = await refreshTokenResponse.json();

			bkashIdToken = bkashRefreshTokenResult.id_token as string;

			await redisClient.set(IdTokenKey, bkashIdToken, {
				expiration: {
					type: "EX",
					value: 60 * 60,
				},
			});

			return bkashIdToken;
		}

		if (bkashIdTokenTTL > 600 && bkashIdToken) {
			return bkashIdToken;
		}

		const response = await fetch(
			`${config.bkash_base_url}/tokenized/checkout/token/grant`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
					username: config.bkash_username!,
					password: config.bkash_password!,
				},
				body: JSON.stringify({
					app_key: config.bkash_app_key,
					app_secret: config.bkash_app_secret,
				}),
			},
		);

		if (!response.ok) {
			throw new AppError(500, "Bkash Access Token Grant Failed");
		}

		const result = await response.json();

		await redisClient.set(IdTokenKey, result.id_token, {
			expiration: {
				type: "EX",
				value: 60 * 60,
			},
		});

		await redisClient.set(RefreshTokenKey, result.refresh_token, {
			expiration: {
				type: "EX",
				value: 60 * 60 * 24 * 28,
			},
		});

		return result.id_token;
	} catch (error: any) {
		if (error instanceof AppError) {
			throw error;
		}

		throw new AppError(500, error.message || "Bkash token error");
	}
};

export const createBkashPayment = async (payload: {
	amount: string;
	merchantInvoiceNumber: string;
	payerReference: string;
	intent?: string;
}) => {
	const idToken = await getBkashIdToken();

	if (!idToken) {
		throw new AppError(500, "Bkash ID token not found");
	}

	const response = await fetch(
		`${config.bkash_base_url}/tokenized/checkout/create`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
				Authorization: idToken,
				"X-APP-Key": config.bkash_app_key!,
			},
			body: JSON.stringify({
				mode: "0011",
				payerReference: payload.payerReference,
				callbackURL: config.bkash_callbackurl,
				amount: payload.amount,
				currency: "BDT",
				intent: payload.intent ?? "sale",
				merchantInvoiceNumber: payload.merchantInvoiceNumber,
			}),
		},
	);

	if (!response.ok) {
		throw new AppError(500, "Bkash payment creation failed");
	}

	const result = await response.json();

	return result;
};

export const executeBkashPayment = async (paymentID: string) => {
	const idToken = await getBkashIdToken();

	if (!idToken) {
		throw new AppError(500, "Bkash ID token not found");
	}

	const response = await fetch(
		`${config.bkash_base_url}/tokenized/checkout/execute`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
				Authorization: idToken,
				"X-APP-Key": config.bkash_app_key!,
			},
			body: JSON.stringify({
				paymentID,
			}),
		},
	);

	if (!response.ok) {
		throw new AppError(500, "Bkash payment execution failed");
	}

	const result = await response.json();

	return result;
};

export const queryBkashPayment = async (paymentID: string) => {
	const idToken = await getBkashIdToken();

	if (!idToken) {
		throw new AppError(500, "Bkash ID token not found");
	}

	const response = await fetch(
		`${config.bkash_base_url}/tokenized/checkout/payment/status`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
				Authorization: idToken,
				"X-APP-Key": config.bkash_app_key!,
			},
			body: JSON.stringify({
				paymentID,
			}),
		},
	);

	if (!response.ok) {
		throw new AppError(500, "Bkash payment query failed");
	}

	const result = await response.json();

	return result;
};
