import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "../models/userModel.js";
import { Session } from "../models/sessionModel.js";
import { verifyEmail } from "../emaiVerify/verifyEmail.js";
import { sendOTPMail } from "../emailVerify/sendOtpMail.js";
import { clientUrl } from "../config/clientUrl.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD = 6;
const RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_TTL_MS = 10 * 60 * 1000;
const RESET_TTL_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
// emails are stored as typed by older accounts, so look them up ignoring case
const CASE_INSENSITIVE = { locale: "en", strength: 2 };

const normalizeEmail = (email) => (typeof email === "string" ? email.trim().toLowerCase() : "");
const findByEmail = (email) => User.findOne({ email }).collation(CASE_INSENSITIVE);
const sha256 = (value) => crypto.createHash("sha256").update(String(value)).digest("hex");
const sameHash = (a, b) => Boolean(a && b) && a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

// seconds left before another mail may be sent, or 0
const cooldownLeft = (sentAt) => (sentAt ? Math.max(0, Math.ceil((sentAt.getTime() + RESEND_COOLDOWN_MS - Date.now()) / 1000)) : 0);

// user object safe to send to the browser (no password hash, OTPs or tokens)
export const publicUser = (doc) => {
  // eslint-disable-next-line no-unused-vars
  const { password, otp, otpExpiry, otpAttempts, otpSentAt, token, verificationSentAt, passwordResetToken, passwordResetExpiry, ...rest } =
    doc.toObject();
  return rest;
};

// new verification token (24h) saved on the user + mailed
const sendVerification = async (user, req) => {
  const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY, { expiresIn: "1d" });
  user.token = token;
  user.verificationSentAt = new Date();
  await user.save();
  verifyEmail(token, user.email, { firstName: user.firstName, baseUrl: clientUrl(req) });
};

export const register = async (req, res) => {
  try {
    const firstName = typeof req.body.firstName === "string" ? req.body.firstName.trim().slice(0, 50) : "";
    const lastName = typeof req.body.lastName === "string" ? req.body.lastName.trim().slice(0, 50) : "";
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address" });
    }
    if (typeof password !== "string" || password.length < MIN_PASSWORD) {
      return res.status(400).json({ success: false, message: `Password must be at least ${MIN_PASSWORD} characters` });
    }

    const existing = await findByEmail(email);
    if (existing?.isVerified) {
      return res.status(400).json({ success: false, message: "An account with this email already exists. Please log in." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let user = existing;
    if (user) {
      // signed up before but never verified: take the new details and send a fresh link
      const wait = cooldownLeft(user.verificationSentAt);
      if (wait) {
        return res.status(429).json({ success: false, message: `Please wait ${wait}s before requesting another email`, retryAfter: wait });
      }
      Object.assign(user, { firstName, lastName, password: hashedPassword });
    } else {
      user = new User({ firstName, lastName, email, password: hashedPassword, isVerified: false });
    }
    await sendVerification(user, req);

    return res.status(201).json({
      success: true,
      message: `Account created! We've sent a verification link to ${user.email}.`,
      email: user.email,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /verify with the emailed token as a Bearer token
export const verify = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(400).json({ success: false, message: "Verification link is missing or invalid" });
    }
    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.SECRET_KEY);
    } catch (error) {
      return res.status(400).json({
        success: false,
        expired: error.name === "TokenExpiredError",
        message:
          error.name === "TokenExpiredError"
            ? "This verification link has expired. Request a new one below."
            : "This verification link is invalid. Request a new one below.",
      });
    }
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(400).json({ success: false, message: "Account not found. Please sign up again." });
    }
    if (user.isVerified) {
      return res.status(200).json({ success: true, alreadyVerified: true, message: "Your email is already verified. You can log in." });
    }
    // only the most recent link works
    if (user.token !== token) {
      return res.status(400).json({ success: false, message: "This link was replaced by a newer one. Use the latest email we sent." });
    }
    user.token = null;
    user.isVerified = true;
    await user.save();
    return res.status(200).json({ success: true, message: "Email verified successfully! You can now log in." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Resend the verification email
export const reVerify = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address" });
    }
    const user = await findByEmail(email);
    if (user?.isVerified) {
      return res.status(200).json({ success: true, alreadyVerified: true, message: "This email is already verified. You can log in." });
    }
    if (user) {
      const wait = cooldownLeft(user.verificationSentAt);
      if (wait) {
        return res.status(429).json({ success: false, message: `Please wait ${wait}s before requesting another email`, retryAfter: wait });
      }
      await sendVerification(user, req);
    }
    // same answer whether or not the account exists
    return res.status(200).json({
      success: true,
      message: "If an unverified account exists for this email, we've sent a new verification link.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }
    const existingUser = await findByEmail(email);
    // one message for both cases, so the form doesn't reveal which emails have accounts
    if (!existingUser || !(await bcrypt.compare(password, existingUser.password))) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }
    if (existingUser.isVerified === false) {
      return res.status(403).json({
        success: false,
        needsVerification: true,
        email: existingUser.email,
        message: "Please verify your email before logging in. Check your inbox for the link.",
      });
    }

    const accessToken = jwt.sign({ id: existingUser._id }, process.env.SECRET_KEY, { expiresIn: "10d" });
    const refreshToken = jwt.sign({ id: existingUser._id }, process.env.SECRET_KEY, { expiresIn: "30d" });

    existingUser.isLoggedIn = true;
    await existingUser.save();

    // one session per user
    await Session.deleteMany({ userId: existingUser._id });
    await Session.create({ userId: existingUser._id });

    return res.status(200).json({
      success: true,
      message: `Welcome back ${existingUser.firstName}`,
      user: publicUser(existingUser),
      accessToken,
      refreshToken,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const userId = req.id;
    await Session.deleteMany({ userId });
    await User.findByIdAndUpdate(userId, { isLoggedIn: false });
    return res.status(200).json({ success: true, message: "User logged out successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Step 1 of "forgot password": email a 6-digit OTP
export const forgotPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address" });
    }
    const user = await findByEmail(email);
    if (user) {
      const wait = cooldownLeft(user.otpSentAt);
      if (wait) {
        return res.status(429).json({ success: false, message: `Please wait ${wait}s before requesting another code`, retryAfter: wait });
      }
      const otp = crypto.randomInt(100000, 1000000).toString();
      user.otp = sha256(otp); // only the hash is stored
      user.otpExpiry = new Date(Date.now() + OTP_TTL_MS);
      user.otpAttempts = 0;
      user.otpSentAt = new Date();
      user.passwordResetToken = null;
      user.passwordResetExpiry = null;
      await user.save();
      sendOTPMail(otp, user.email);
    }
    // same answer whether or not the account exists
    return res.status(200).json({
      success: true,
      message: "If an account exists for this email, we've sent a 6-digit code to it.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Step 2: check the OTP; a correct one returns a short-lived reset token
export const verifyOTP = async (req, res) => {
  try {
    const otp = typeof req.body.otp === "string" ? req.body.otp.trim() : String(req.body.otp ?? "");
    const email = normalizeEmail(req.params.email);
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ success: false, message: "Enter the 6-digit code from the email" });
    }
    const user = await findByEmail(email);
    if (!user || !user.otp || !user.otpExpiry) {
      return res.status(400).json({ success: false, message: "No active code for this email. Please request a new one." });
    }
    if (user.otpExpiry < new Date()) {
      return res.status(400).json({ success: false, expired: true, message: "This code has expired. Please request a new one." });
    }
    if (!sameHash(sha256(otp), user.otp)) {
      user.otpAttempts += 1;
      const attemptsLeft = MAX_OTP_ATTEMPTS - user.otpAttempts;
      if (attemptsLeft <= 0) {
        user.otp = null;
        user.otpExpiry = null;
      }
      await user.save();
      return res.status(400).json({
        success: false,
        attemptsLeft: Math.max(0, attemptsLeft),
        message:
          attemptsLeft > 0
            ? `Incorrect code. ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} left.`
            : "Too many incorrect attempts. Please request a new code.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.otp = null;
    user.otpExpiry = null;
    user.otpAttempts = 0;
    user.passwordResetToken = sha256(resetToken);
    user.passwordResetExpiry = new Date(Date.now() + RESET_TTL_MS);
    await user.save();
    return res.status(200).json({ success: true, message: "Code verified. Choose a new password.", resetToken });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Step 3: set the new password with the reset token from step 2
export const resetPassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword, resetToken } = req.body;
    const email = normalizeEmail(req.params.email);
    const user = await findByEmail(email);
    if (
      !user ||
      !resetToken ||
      !user.passwordResetExpiry ||
      user.passwordResetExpiry < new Date() ||
      !sameHash(sha256(resetToken), user.passwordResetToken)
    ) {
      return res.status(403).json({ success: false, message: "Your reset session has expired. Please start again." });
    }
    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }
    if (typeof newPassword !== "string" || newPassword.length < MIN_PASSWORD) {
      return res.status(400).json({ success: false, message: `Password must be at least ${MIN_PASSWORD} characters` });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordResetToken = null;
    user.passwordResetExpiry = null;
    // they proved they own the inbox
    user.isVerified = true;
    await user.save();
    return res.status(200).json({ success: true, message: "Password changed successfully. Please log in." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
