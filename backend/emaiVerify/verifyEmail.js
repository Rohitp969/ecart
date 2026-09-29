import { emailLayout, escapeHtml, sendMail } from "../utils/sendMail.js";

// Email verification link sent after signup (and on "resend")
export const verifyEmail = (token, email, { firstName, baseUrl }) => {
  const link = `${baseUrl}/verify/${token}`;
  return sendMail({
    to: email,
    subject: "Verify your Ekart email",
    html: emailLayout({
      title: `Welcome${firstName ? `, ${escapeHtml(firstName)}` : ""}!`,
      intro: "Thanks for signing up. Please confirm your email address to activate your account.",
      button: { href: link, label: "Verify my email" },
      outro: "This link expires in 24 hours. If you didn't create an Ekart account, you can ignore this email.",
    }),
    devNote: `Verification link: ${link}`,
  });
};
