/** biome-ignore-all lint/style/noNonNullAssertion: <explanation> */
import dotenv from "dotenv";
import path from "path";
import type { SignOptions } from "jsonwebtoken";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
	port: process.env.PORT,
	database_url: process.env.DATABASE_URL,
	bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
	jwt_access_secret: process.env.JWT_ACCESS_SECRET,
	jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
	jwt_access_expires_in: process.env
		.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
	jwt_refresh_expires_in: process.env
		.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"],
	node_env: process.env.NODE_ENV,
	redis_user: process.env.REDIS_USER,
	redis_password: process.env.REDIS_PASSWORD,
	redis_host: process.env.REDIS_HOST,
	redis_port: process.env.REDIS_PORT,
	super_admin_email: process.env.SEED_ADMIN_EMAIL,
	super_admin_password: process.env.SEED_ADMIN_PASSWORD,
	smtp_user: process.env.SMTP_USER,
	smtp_password: process.env.SMTP_PASSWORD,
	email_sender: process.env.EMAIL_SENDER,
	bkash_base_url: process.env.BKASH_BASE_URL,
	bkash_username: process.env.BKASH_USERNAME,
	bkash_app_key: process.env.BKASH_APP_KEY,
	bkash_password: process.env.BKASH_PASSWORD,
	bkash_app_secret: process.env.BKASH_APP_SECRET,
};
