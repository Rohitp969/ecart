import { rateLimit } from "express-rate-limit";

// Per-IP limits for the sign-in endpoints, on top of the per-account cooldowns and attempt limits
// in authController. Answers in the API's usual { success, message } shape.
const limiter = (limit, minutes, message) =>
  rateLimit({
    windowMs: minutes * 60 * 1000,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { success: false, message },
  });

// login and signup
export const authLimiter = limiter(20, 15, "Too many attempts. Please wait a few minutes and try again.");

// checking 6-digit codes (signup and password reset)
export const codeLimiter = limiter(15, 15, "Too many code attempts. Please wait a few minutes and try again.");

// anything that sends an email: resend code, change email, forgot password
export const mailLimiter = limiter(8, 15, "Too many emails requested. Please wait a few minutes and try again.");
