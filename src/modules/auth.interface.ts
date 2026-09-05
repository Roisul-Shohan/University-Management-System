/** biome-ignore-all lint/style/useImportType: import is used as a runtime value */
import { Role } from "../../generated/prisma/enums";

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface VerifyEmailInput {
  email: string;
  otp: string;
}

export interface PendingRegistration {
  name: string;
  email: string;
  hashed_password: string;
  role: Role;
  otpHash: string;
}