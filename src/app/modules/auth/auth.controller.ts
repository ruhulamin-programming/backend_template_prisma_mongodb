import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { authService } from "./auth.service";
import sendResponse from "../../../shared/sendResponse";

const loginUser = catchAsync(async (req, res) => {
  const result = await authService.loginUserIntoDB(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User successfully logged in",
    data: result,
  });
});

const googleLogin = catchAsync(async (req, res) => {
  const result = await authService.googleLogin(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Google login has been successfull",
    data: result,
  });
});

const userLocationUpdateInRedis = catchAsync(async (req, res) => {
  const { id } = req.user;
  await authService.userLocationUpdateInRedis(id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Your location updated successfully",
  });
});

const sendForgotPasswordOtp = catchAsync(
  async (req: Request, res: Response) => {
    const email = req.body.email as string;
    const response = await authService.sendForgotPasswordOtpDB(email);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "OTP send successfully",
      data: response,
    });
  },
);

const verifyForgotPasswordOtpCode = catchAsync(
  async (req: Request, res: Response) => {
    const payload = req.body;
    const response = await authService.verifyForgotPasswordOtpCodeDB(payload);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "OTP verified successfully.",
      data: response,
    });
  },
);

const resetPassword = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { newPassword } = req.body;
  const result = await authService.resetForgotPasswordDB(newPassword, userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Password updated successfully.",
    data: result,
  });
});

const myProfile = catchAsync(async (req, res) => {
  const { id } = req.user;
  const user = await authService.myProfile(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Your profile has been retrieved successfully",
    data: user,
  });
});

const updateProfile = catchAsync(async (req, res) => {
  const { id } = req.user;
  const file = req.file as Express.Multer.File;
  await authService.updateProfileIntoDB(id, req.body, file);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Your profile has been updated successfully",
  });
});

const changePassword = catchAsync(async (req, res) => {
  const { id } = req.user;
  await authService.changePassword(
    req.body.newPassword,
    id,
    req.body.oldPassword,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Your password has been updated successfully",
  });
});

const deleteAccount = catchAsync(async (req, res) => {
  const { id } = req.user;
  await authService.deleteAccount(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Your account has been deleted successfully",
  });
});

export const authController = {
  loginUser,
  googleLogin,
  myProfile,
  updateProfile,
  userLocationUpdateInRedis,
  sendForgotPasswordOtp,
  verifyForgotPasswordOtpCode,
  resetPassword,
  changePassword,
  deleteAccount,
};
