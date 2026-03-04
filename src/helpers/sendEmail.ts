import nodemailer from "nodemailer";
import config from "../config";
const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  text?: string,
) => {
  // Create a transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    port: 587,
    secure: false,
    auth: {
      user: config.emailSender.email,
      pass: config.emailSender.app_pass,
    },
  });

  // Email options
  const mailOptions = {
    from: config.emailSender.email,
    to,
    subject,
    html,
    text,
  };
  await transporter.sendMail(mailOptions);
};

export default sendEmail;
