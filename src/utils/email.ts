import ejs from "ejs";
import path from "path";
import { transporter } from "../lib/nodemailer";
import AppError from "../errors/AppErrors";
import config from "../config";

export const sendVerificationEmail = async (
	email: string,
	name: string,
	otp: string,
) => {
	const templatePath = path.join(
		process.cwd(),
		"src",
		"views",
		"emails",
		"verification-otp.ejs",
	);

	const html = await ejs.renderFile(templatePath, {
		name,
		otp,
		year: new Date().getFullYear(),
	});

	try {
		await transporter.sendMail({
			from: `"University Management System" <${config.email_sender}>`,
			to: email,
			subject: "Verify your email address",
			html,
		});
	} catch (error) {
		throw new AppError(
			500,
			"Unable to send verification email. Please try again.",
		);
	}
};

export const sendPasswordResetEmail = async (
	email: string,
	name: string,
	otp: string,
) => {
	const templatePath = path.join(
		process.cwd(),
		"src",
		"views",
		"emails",
		"password-reset-otp.ejs",
	);

	const html = await ejs.renderFile(templatePath, {
		name,
		otp,
		year: new Date().getFullYear(),
	});

	try {
		await transporter.sendMail({
			from: `"University Management System" <${process.env.EMAIL_USER}>`,
			to: email,
			subject: "Reset your password",
			html,
		});
	} catch (error) {
		throw new AppError(
			500,
			"Unable to send password reset email. Please try again.",
		);
	}
};
