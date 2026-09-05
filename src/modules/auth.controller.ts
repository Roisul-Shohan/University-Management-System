import { Request, Response } from "express";
import { registerUser, verifyEmail } from "./auth.service";
import catchAsync from "../utils/catchAsync";
import { jwtUtils } from "../utils/jwt";
import config from "../config";

export const register = catchAsync(async (
  req: Request,
  res: Response
) => {
  const result = await registerUser(req.body);

  res.status(201).json({
    success: true,
    message: result.message,
    data:{} ,
  });
});

export const verifyEmailController = catchAsync(async (
  req: Request,
  res: Response
) => {
  const user = await verifyEmail(req.body);

  // Create access token
  const accessToken = jwtUtils.createToken(
    {
      userId: user.id,
      role: user.role,
      tokenType: "access",
    },
    config.jwt_access_secret!,
    config.jwt_access_expires_in
  );

// Create refresh token
  const refreshToken = jwtUtils.createToken(
    {
      userId: user.id,
      tokenType: "refresh",
    },
    config.jwt_refresh_secret!,
    config.jwt_refresh_expires_in,
    
  );

  res.status(200).json({
    success: true,
    message: "Email verified successfully.",
  data: {
      user,
      accessToken,
      refreshToken,
    },
  });
});

