import { z } from "zod";

const googleLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First Name is required"),
  fcmToken: z.string().min(1, "FCM token is required"),
});

const locationUpdateSchema = z.object({
  latitude: z
    .number()
    .min(-90, "Latitude must be greater than or equal to -90")
    .max(90, "Latitude must be less than or equal to 90"),
  longitude: z
    .number()
    .min(-180, "Longitude must be greater than or equal to -180")
    .max(180, "Longitude must be less than or equal to 180"),
});

const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters long")
    .optional(),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters long")
    .optional(),
  mobile: z
    .string()
    .min(10, "Mobile must be at least 10 characters long")
    .optional(),
});

export const authValidation = {
  updateProfileSchema,
  googleLoginSchema,
  locationUpdateSchema,
};
