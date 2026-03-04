import { User } from "@prisma/client";
import ApiError from "../../../errors/ApiErrors";
import bcrypt from "bcryptjs";
import prisma from "../../../shared/prisma";
import generateOTP from "../../../helpers/generateOtp";
import redisClient from "../../../helpers/redis";
import { emailQueue } from "../../../queues/emailQueue";
import config from "../../../config";

const createUser = async (payload: User) => {
  const existingUser = await prisma.user.findFirst({
    where: { email: payload.email },
  });
  if (existingUser) {
    throw new ApiError(409, "User already exists using this email.");
  }

  const hashedPassword = await bcrypt.hash(
    payload.password,
    Number(config.jwt.gen_salt),
  );

  const pendingUserData = {
    email: payload.email,
    fullName: payload.fullName,
    password: hashedPassword,
  };

  await redisClient.set(
    `pendingUser:${payload.email}`,
    JSON.stringify(pendingUserData),
    "EX",
    300,
  );

  const otp = generateOTP();

  await redisClient.set(`otp:${payload.email}`, otp, "EX", 300);

  await emailQueue.add("sendOtp", {
    email: payload.email,
    fullName: payload.fullName,
    otp,
  });

  return otp;
};

const signupVerification = async (payload: { email: string; otp: string }) => {
  const { email, otp } = payload;

  const savedOtp = await redisClient.get(`otp:${email}`);
  if (!savedOtp) {
    throw new ApiError(400, "Invalid or expired OTP.");
  }

  if (otp !== savedOtp) {
    throw new ApiError(401, "Invalid OTP.");
  }

  const pendingUserStr = await redisClient.get(`pendingUser:${email}`);
  if (!pendingUserStr) {
    throw new ApiError(404, "No pending user found. Please sign up again.");
  }
  const pendingUser = JSON.parse(pendingUserStr);

  await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        email: pendingUser.email,
        fullName: pendingUser.fullName,
        password: pendingUser.password,
      },
    });

    return createdUser;
  });

  await Promise.all([
    redisClient.del(`otp:${email}`),
    redisClient.del(`pendingUser:${email}`),
  ]);

  return;
};

const getSingleUser = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new ApiError(404, "user not found!");
  }

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
  };
};

export const userService = {
  createUser,
  signupVerification,
  getSingleUser,
};
