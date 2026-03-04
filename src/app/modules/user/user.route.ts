import express from "express";
import { UserControllers } from "./user.controller";
import validateRequest from "../../middlewares/validateRequest";
import { userValidation } from "./user.validation";

const router = express.Router();

router.post(
  "/create",
  validateRequest(userValidation.userRegisterValidationSchema),
  UserControllers.createUser,
);
router.post(
  "/signup-verification",
  validateRequest(userValidation.verificationSchema),
  UserControllers.signupVerification,
);
router.get("/:id", UserControllers.getSingleUser);

export const userRoutes = router;
