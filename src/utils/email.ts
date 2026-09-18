import ejs from "ejs";
import path from "path";
import { transporter } from "../lib/nodemailer.js";
import AppError from "../errors/AppErrors.js";
import config from "../config/index.js";

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
  } catch {
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
  } catch {
    throw new AppError(
      500,
      "Unable to send password reset email. Please try again.",
    );
  }
};

export const sendAcademicPeriodEmail = async (
  email: string,
  name: string,
  title: string,
  message: string,
  endDate: Date,
) => {
  const templatePath = path.join(
    process.cwd(),
    "src",
    "views",
    "emails",
    "academic-period-opened.ejs",
  );

  const formattedEndDate = endDate.toLocaleDateString();

  const html = await ejs.renderFile(templatePath, {
    name,
    title,
    message,
    endDate: formattedEndDate,
    year: new Date().getFullYear(),
  });

  try {
    await transporter.sendMail({
      from: `"University Management System" <${config.email_sender}>`,
      to: email,
      subject: title,
      html,
    });
  } catch {
    throw new AppError(
      500,
      "Unable to send academic period email. Please try again.",
    );
  }
};

export const sendAdmissionWelcomeEmail = async (
  email: string,
  name: string,
  studentId: string,
) => {
  const templatePath = path.join(
    process.cwd(),
    "src",
    "views",
    "emails",
    "admission-welcome.ejs",
  );

  const html = await ejs.renderFile(templatePath, {
    name,
    studentId,
    year: new Date().getFullYear(),
  });

  try {
    await transporter.sendMail({
      from: `"University Management System" <${config.email_sender}>`,
      to: email,
      subject: "Welcome to the University!",
      html,
    });
  } catch (error) {
    // Log the error but don't fail the transaction
    console.error("Failed to send welcome email:", error);
  }
};

export const sendPaymentSuccessEmail = async (
  email: string,
  name: string,
  title: string,
  message: string,
) => {
  const templatePath = path.join(
    process.cwd(),
    "src",
    "views",
    "emails",
    "payment-success.ejs",
  );

  const html = await ejs.renderFile(templatePath, {
    name,
    title,
    message,
    year: new Date().getFullYear(),
  });

  try {
    await transporter.sendMail({
      from: `"University Management System" <${config.email_sender}>`,
      to: email,
      subject: `${title} Complete!`,
      html,
    });
  } catch (error) {
    console.error("Failed to send payment success email:", error);
  }
};

const sendMilestoneEmail = async (
  email: string,
  name: string,
  title: string,
  message: string,
  template: string,
) => {
  const templatePath = path.join(
    process.cwd(),
    "src",
    "views",
    "emails",
    template,
  );

  const html = await ejs.renderFile(templatePath, {
    name,
    message,
    year: new Date().getFullYear(),
  });

  try {
    await transporter.sendMail({
      from: `"University Management System" <${config.email_sender}>`,
      to: email,
      subject: `${title} Complete!`,
      html,
    });
  } catch (error) {
    console.error(`Failed to send ${title.toLowerCase()} email:`, error);
  }
};

export const sendSemesterRegistrationEmail = (
  email: string,
  name: string,
  semester: string,
) =>
  sendMilestoneEmail(
    email,
    name,
    "Semester Registration",
    `Your registration for ${semester} has been completed successfully.`,
    "semester-registration.ejs",
  );

export const sendCourseRegistrationEmail = (
  email: string,
  name: string,
  term: string,
) =>
  sendMilestoneEmail(
    email,
    name,
    "Course Registration",
    `Your course registration for ${term} has been completed successfully.`,
    "course-registration.ejs",
  );
