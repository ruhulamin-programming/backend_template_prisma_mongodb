import { Worker } from "bullmq";
import sendEmail from "../helpers/sendEmail";
import redisClient from "../helpers/redis";

new Worker(
  "emails",
  async (job) => {
    const { email, fullName, otp } = job.data;

    let subject = "";
    let html = "";

    if (job.name === "sendOtp") {
      subject = "Account verification";
      html = `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Account verification</h2>
          <p>Hi <b>${fullName}</b>,</p>
          <p>Your OTP for account verification is:</p>
          <h1 style="color: #007BFF;">${otp}</h1>
          <p>This OTP is valid for <b>5 minutes</b>. If you did not request this, please ignore this email.</p>
          <p>Thanks, <br>The Support Team</p>
        </div>
      `;
    } else if (job.name === "forgotPasswordOtp") {
      subject = "Your Password Reset OTP";
      html = `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Password Reset Request</h2>
          <p>Hi <b>${fullName}</b>,</p>
          <p>Your OTP for password reset is:</p>
          <h1 style="color: #007BFF;">${otp}</h1>
          <p>This OTP is valid for <b>5 minutes</b>. If you did not request this, please ignore this email.</p>
          <p>Thanks, <br>The Support Team</p>
        </div>
      `;
    } else {
      console.warn(`Unknown job name: ${job.name}`);
      return;
    }
    try {
      await sendEmail(email, subject, html);
      console.log(`✅ Email sent to ${email} for job: ${job.name}`);
    } catch (err) {
      console.error("Failed to send email:", err);
    }
  },
  { connection: redisClient }
);
