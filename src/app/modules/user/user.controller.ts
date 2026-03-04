import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { userService } from "./user.services";

const createUser = catchAsync(async (req, res) => {
  const result = await userService.createUser(req.body);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Check your email for signup verification",
    data: result,
  });
});

const signupVerification = catchAsync(async (req, res) => {
  const result = await userService.signupVerification(req.body);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "OTP verification successful",
    data: result,
  });
});

const getSingleUser = catchAsync(async (req, res) => {
  const user = await userService.getSingleUser(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "User retrieved successfully",
    data: user,
  });
});

export const UserControllers = {
  createUser,
  signupVerification,
  getSingleUser,
};
