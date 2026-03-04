import { z } from "zod";

const userRegisterValidationSchema = z.object({
  fullName: z.string().min(1, "Full name must be at least 1 characters long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

const verificationSchema = z.object({
  email: z.string().min(10, "Phone Number min 10 Digit"),
  otp: z.string().min(4, "OTP must be at least 4 characters long"),
});

const userUpdateValidationSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters long")
    .optional(),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters long")
    .optional(),
  mobile: z.string().min(10, "Mobile Number at least 10 Digit long").optional(),
  role: z.enum(["ADMIN", "USER"]).optional(),
  status: z.enum(["ACTIVE", "BLOCKED", "DELETED"]).optional(),
});

export const userValidation = {
  userRegisterValidationSchema,
  verificationSchema,
  userUpdateValidationSchema,
};
