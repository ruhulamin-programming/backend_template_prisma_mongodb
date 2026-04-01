import { User } from "@prisma/client";
import ApiError from "../../../errors/ApiErrors";
import bcrypt from "bcryptjs";
import prisma from "../../../shared/prisma";
import generateOTP from "../../../helpers/generateOtp";
import config from "../../../config";
import sendEmail from "../../../helpers/sendEmail";

const createUser = async (payload: User) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });
  if (existingUser) {
    throw new ApiError(409, "User already exists using this email.");
  }

  const hashedPassword = await bcrypt.hash(
    payload.password,
    Number(config.jwt.gen_salt),
  );

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    await tx.pendingUser.upsert({
      where: { email: payload.email },
      update: {
        email: payload.email,
        fullName: payload.fullName,
        password: hashedPassword,
      },
      create: {
        email: payload.email,
        fullName: payload.fullName,
        password: hashedPassword,
      },
    });

    await tx.otp.upsert({
      where: { email: payload.email },
      update: { otp, expiresAt },
      create: { email: payload.email, otp, expiresAt },
    });
  });

  const emailSubject = "Signup Verification";
  const emailHtml = `<div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Account verification</h2>
          <p>Hi <b>${payload.fullName}</b>,</p>
          <p>Your OTP for account verification is:</p>
          <h1 style="color: #007BFF;">${otp}</h1>
          <p>This OTP is valid for <b>5 minutes</b>. If you did not request this, please ignore this email.</p>
          <p>Thanks, <br>The Support Team</p>
        </div>`;
  await sendEmail(payload.email, emailSubject, emailHtml);

  return otp;
};

const signupVerification = async (payload: { email: string; otp: string }) => {
  const { email, otp } = payload;

  const pendingUser = await prisma.pendingUser.findUnique({
    where: { email },
  });
  if (!pendingUser) {
    throw new ApiError(404, "No pending user found. Please sign up again.");
  }

  const otpRecord = await prisma.otp.findUnique({ where: { email } });
  if (!otpRecord) {
    throw new ApiError(400, "OTP not found. Please sign up again.");
  }

  if (new Date() > otpRecord.expiresAt) {
    await prisma.otp.delete({ where: { email } });
    throw new ApiError(400, "OTP has expired. Please sign up again.");
  }

  if (otp !== otpRecord.otp) {
    throw new ApiError(401, "Invalid OTP.");
  }

  await prisma.$transaction(async (tx) => {
    await prisma.user.create({
      data: {
        email: pendingUser.email,
        fullName: pendingUser.fullName,
        password: pendingUser.password,
      },
    });
    await tx.pendingUser.delete({ where: { email } });
    await tx.otp.delete({ where: { email } });
  });

  return;
};

export const userService = {
  createUser,
  signupVerification,
};
