import { emailLayout, escapeHtml, sendMail } from "../utils/sendMail.js";

// 6-digit code that verifies a new account's email (sent after signup, on "resend" and after a change of email)
export const sendSignupOtpMail = (otp, email, { firstName } = {}) =>
  sendMail({
    to: email,
    subject: `${otp} is your Ekart verification code`,
    html: emailLayout({
      title: `Welcome${firstName ? `, ${escapeHtml(firstName)}` : ""}!`,
      intro: `Enter this code on the Ekart verification screen to activate your account:
        <p style="margin:20px 0;font-size:32px;font-weight:800;letter-spacing:8px;color:#111827">${otp}</p>
        It expires in 5 minutes.`,
      outro: "Didn't create an Ekart account? You can ignore this email. Never share this code with anyone.",
    }),
    devNote: `Email verification code for ${email}: ${otp}`,
  });
