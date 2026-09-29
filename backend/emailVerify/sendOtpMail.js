import { emailLayout, sendMail } from "../utils/sendMail.js";

// 6-digit OTP for "forgot password"
export const sendOTPMail = (otp, email) =>
  sendMail({
    to: email,
    subject: `${otp} is your Ekart password reset code`,
    html: emailLayout({
      title: "Reset your password",
      intro: `Use this code to reset your Ekart password:
        <p style="margin:20px 0;font-size:32px;font-weight:800;letter-spacing:8px;color:#111827">${otp}</p>
        It expires in 10 minutes.`,
      outro: "Didn't ask to reset your password? You can ignore this email — your password stays the same.",
    }),
    devNote: `Password reset OTP for ${email}: ${otp}`,
  });
