import prisma from "../../../shared/prisma";
import bcrypt from "bcryptjs";
import ApiError from "../../../errors/ApiErrors";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import config from "../../../config";
import { User } from "@prisma/client";
import generateOTP from "../../../helpers/generateOtp";
import redisClient from "../../../helpers/redis";
import { uploadInSpace } from "../../../helpers/uploadInSpace";
import { emailQueue } from "../../../queues/emailQueue";

const loginUserIntoDB = async (payload: {
  email: string;
  password: string;
  fcmToken: string;
}) => {
  const user = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await bcrypt.compare(
    payload.password,
    user?.password,
  );

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  await prisma.user.update({
    where: {
      email: payload.email,
    },
    data: {
      fcmToken: payload.fcmToken,
    },
  });

  const accessToken = jwtHelpers.generateToken(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.jwt_secret as string,
    config.jwt.expires_in as string,
  );

  return {
    id: user.id,
    accessToken,
    role: user.role,
  };
};

const googleLogin = async (payload: {
  email: string;
  fullName: string;
  fcmToken: string;
}) => {
  const user = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (user) {
    const accessToken = jwtHelpers.generateToken(
      { id: user.id, email: user.email, role: user.role },
      config.jwt.jwt_secret as string,
      config.jwt.expires_in as string,
    );
    return {
      id: user.id,
      accessToken,
      role: user.role,
    };
  }

  const newUser = await prisma.user.create({
    data: {
      email: payload.email,
      fullName: payload.fullName,
      password: "",
      fcmToken: payload.fcmToken,
    },
  });

  const accessToken = jwtHelpers.generateToken(
    { id: newUser.id, email: newUser.email, role: newUser.role },
    config.jwt.jwt_secret as string,
    config.jwt.expires_in as string,
  );

  return {
    id: newUser.id,
    accessToken,
    role: newUser.role,
  };
};

const userLocationUpdateInRedis = async (
  userId: string,
  userLocation: { longitude: number; latitude: number },
) => {
  const redisGeoKey = "userLocations";

  // Use GEOADD to store location
  await redisClient.geoadd(
    redisGeoKey,
    userLocation.longitude,
    userLocation.latitude,
    userId,
  );

  return;
};

const sendForgotPasswordOtpDB = async (email: string) => {
  const existringUser = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });
  if (!existringUser) {
    throw new ApiError(404, "User not found");
  }
  const otp = generateOTP();

  await redisClient.set(`otp:${email}`, otp, "EX", 300);

  await emailQueue.add("forgotPasswordOtp", {
    email: existringUser.email,
    fullName: existringUser.fullName,
    otp: otp,
  });

  return otp;
};

const verifyForgotPasswordOtpCodeDB = async (payload: {
  email: string;
  otp: string;
}) => {
  const { email, otp } = payload;

  const user = await prisma.user.findUnique({ where: { email: email } });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const userId = user.id;

  const savedOtp = await redisClient.get(`otp:${email}`);
  if (!savedOtp) {
    throw new ApiError(400, "Invalid or expired OTP.");
  }

  if (otp !== savedOtp) {
    throw new ApiError(401, "Invalid OTP.");
  }

  await redisClient.del(`otp:${email}`);

  const forgetToken = jwtHelpers.generateToken(
    { id: userId, email },
    config.jwt.jwt_secret as string,
    config.jwt.expires_in as string,
  );

  return { forgetToken };
};

const resetForgotPasswordDB = async (newPassword: string, userId: string) => {
  const existingUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!existingUser) {
    throw new ApiError(404, "user not found");
  }
  const email = existingUser.email as string;
  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(config.jwt.gen_salt),
  );

  await prisma.user.update({
    where: {
      email: email,
    },
    data: {
      password: hashedPassword,
    },
  });
  return;
};

const myProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      gender: true,
      address: true,
      phoneNumber: true,
      bio: true,
      dob: true,
      profileImage: true,
      email: true,
    },
  });
  if (!user) {
    throw new ApiError(404, "User not found!");
  }

  return user;
};

const updateProfileIntoDB = async (
  userId: string,
  userData: User,
  file: Express.Multer.File,
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found for edit");

  let profileImage;
  if (file) {
    profileImage = await uploadInSpace(file, "users/profileImage");
  }
  await prisma.user.update({
    where: { id: userId },
    data: {
      ...userData,
      profileImage: file ? profileImage : user.profileImage,
    },
  });

  return;
};

const changePassword = async (
  newPassword: string,
  userId: string,
  oldPassword: string,
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");

  const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

  if (!isPasswordValid) throw new ApiError(401, "Wrong old password");

  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(config.jwt.gen_salt),
  );

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      password: hashedPassword,
    },
  });
  return;
};

const deleteAccount = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");

  await prisma.user.delete({
    where: {
      id: userId,
    },
  });
  return;
};

export const authService = {
  loginUserIntoDB,
  googleLogin,
  myProfile,
  updateProfileIntoDB,
  userLocationUpdateInRedis,
  sendForgotPasswordOtpDB,
  verifyForgotPasswordOtpCodeDB,
  resetForgotPasswordDB,
  changePassword,
  deleteAccount,
};
