/** biome-ignore-all lint/style/useNodejsImportProtocol: <explanation> */
import bcrypt from "bcryptjs";
import { PendingRegistration, RegisterUserInput, VerifyEmailInput } from "./auth.interface";
import { prisma } from "../lib/prisma";
import AppError from "../errors/AppErrors";
import { redisClient } from "../lib/redis";
import { randomInt } from "crypto";
import { sendVerificationEmail } from "../utils/email";

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

  await redisClient.set(
    redisKey,
    JSON.stringify(pendingRegistration),
    {
        expiration :{
          type: "EX",
          value : OTP_EXPIRATION
        }
    }
    
  );


  await sendVerificationEmail(
    email,
    name,
    otp
  );

  return {
    message:
      "Registration initiated. Please check your email for the verification code.",
  };
};

export const verifyEmail = async (
  data: VerifyEmailInput
) => {
  const { email, otp } = data;

  const redisKey = `email-verification:${email}`;
  const lockKey = `email-verification-lock:${email}`;

  // Acquire lock for this email
const lockAcquired = await redisClient.set(
  lockKey,
  "1",
  {
    expiration: {
      type: "EX",
      value: 30
    },
    condition: "NX"
  }
);

  // Another verification request is already processing
  if (!lockAcquired) {
    throw new AppError(
      429,
      "Verification is already being processed. Please try again."
    );
  }

  
   try{ // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError(
        409,
        "An account with this email already exists."
      );
    }

    //Get pending registration from Redis
    const storedData = await redisClient.get(redisKey);

    if (!storedData) {
      throw new AppError(
        400,
        "Verification code has expired or registration was not found."
      );
    }

    const pendingRegistration =
      JSON.parse(storedData) as PendingRegistration;

    //Compare OTP with stored hash
    const otpMatched = await bcrypt.compare(
      otp,
      pendingRegistration.otpHash
    );

    if (!otpMatched) {
      throw new AppError(
        400,
        "Invalid verification code."
      );
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
