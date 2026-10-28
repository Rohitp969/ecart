import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "../models/userModel.js";
import { Session } from "../models/sessionModel.js";
import { sendSignupOtpMail } from "../emaiVerify/verifyEmail.js";
import { sendOTPMail } from "../emailVerify/sendOtpMail.js";
import { isMailConfigured } from "../utils/sendMail.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD = 6;
// forgot-password code
const RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_TTL_MS = 10 * 60 * 1000;
const RESET_TTL_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
// signup email-verification code
const EMAIL_OTP_TTL_MS = 5 * 60 * 1000;
const EMAIL_OTP_COOLDOWN_MS = 30 * 1000;
// emails are stored as typed by older accounts, so look them up ignoring case
const CASE_INSENSITIVE = { locale: "en", strength: 2 };

const normalizeEmail = (email) => (typeof email === "string" ? email.trim().toLowerCase() : "");
const findByEmail = (email) => User.findOne({ email }).collation(CASE_INSENSITIVE);
const sha256 = (value) => crypto.createHash("sha256").update(String(value)).digest("hex");
const sameHash = (a, b) => Boolean(a && b) && a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
const newOtp = () => crypto.randomInt(100000, 1000000).toString();
const readOtp = (value) => (typeof value === "string" ? value.trim() : String(value ?? ""));

// seconds left before another mail may be sent, or 0
const cooldownLeft = (sentAt, cooldownMs = RESEND_COOLDOWN_MS) =>
  sentAt ? Math.max(0, Math.ceil((sentAt.getTime() + cooldownMs - Date.now()) / 1000)) : 0;

// user object safe to send to the browser (no password hash, codes or tokens; token and
// verificationSentAt only exist on accounts from the old verification-link flow)
export const publicUser = (doc) => {
  /* eslint-disable no-unused-vars */
  const {
    password, otp, otpExpiry, otpAttempts, otpSentAt, emailOtp, emailOtpExpiry, emailOtpAttempts, emailOtpSentAt,
    token, verificationSentAt, passwordResetToken, passwordResetExpiry, ...rest
  } = doc.toObject();
  /* eslint-enable no-unused-vars */
  return rest;
};

// a mail that should have gone out but didn't (without mail settings it's printed to the console instead)
const mailFailed = (sent) => !sent && isMailConfigured();

const MAIL_FAILED = "We couldn't send the email right now. Please try again in a minute.";

// Short-lived proof that this browser just signed up (or entered the right password), so the verify
// screen may change the address the code goes to. Not accepted anywhere else.
const verifyTokenFor = (user) => jwt.sign({ id: user._id, purpose: "verify-email" }, process.env.SECRET_KEY, { expiresIn: "1h" });

// What the verify screen needs after a code goes out
const codePayload = (user, resendIn = EMAIL_OTP_COOLDOWN_MS / 1000) => ({
  email: user.email,
  verifyToken: verifyTokenFor(user),
  expiresIn: EMAIL_OTP_TTL_MS / 1000,
  resendIn,
});

// New 6-digit signup code; only its hash is stored. Resolves false when the mail couldn't be sent.
const sendEmailOtp = async (user) => {
  const otp = newOtp();
  user.emailOtp = sha256(otp);
  user.emailOtpExpiry = new Date(Date.now() + EMAIL_OTP_TTL_MS);
  user.emailOtpAttempts = 0;
  user.emailOtpSentAt = new Date();
  await user.save();
  const sent = await sendSignupOtpMail(otp, user.email, { firstName: user.firstName });
  if (mailFailed(sent)) {
    // the code never arrived: drop it and let them ask again straight away
    user.emailOtp = null;
    user.emailOtpExpiry = null;
    user.emailOtpSentAt = null;
    await user.save();
    return false;
  }
  return true;
};

const clearEmailOtp = (user) => {
  user.emailOtp = null;
  user.emailOtpExpiry = null;
  user.emailOtpAttempts = 0;
  user.emailOtpSentAt = null;
};

// Sign the user in (login, and straight after verifying their email): tokens + one session per user
const startSession = async (user) => {
  const accessToken = jwt.sign({ id: user._id }, process.env.SECRET_KEY, { expiresIn: "10d" });
  const refreshToken = jwt.sign({ id: user._id }, process.env.SECRET_KEY, { expiresIn: "30d" });
  user.isLoggedIn = true;
  await user.save();
  await Session.deleteMany({ userId: user._id });
  await Session.create({ userId: user._id });
  return { user: publicUser(user), accessToken, refreshToken };
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
      // signed up before but never verified: take the new details and send a fresh code
      const wait = cooldownLeft(user.emailOtpSentAt, EMAIL_OTP_COOLDOWN_MS);
      if (wait) {
        return res.status(429).json({ success: false, message: `Please wait ${wait}s before requesting another code`, retryAfter: wait });
      }
      Object.assign(user, { firstName, lastName, password: hashedPassword });
    } else {
      user = new User({ firstName, lastName, email, password: hashedPassword, isVerified: false });
    }

    if (!(await sendEmailOtp(user))) {
      return res.status(502).json({
        success: false,
        emailFailed: true,
        ...codePayload(user, 0),
        message: "Your account was created, but we couldn't send the verification code. Tap “Resend code” to try again.",
      });
    }
    return res.status(201).json({
      success: true,
      message: `We've sent a 6-digit code to ${user.email}`,
      ...codePayload(user),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /verify-email { email, otp }: the right code verifies the email and signs the user in
export const verifyEmailOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = readOtp(req.body.otp);
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address" });
    }
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ success: false, message: "Enter the 6-digit code from the email" });
    }
    const user = await findByEmail(email);
    if (!user) {
      return res.status(400).json({ success: false, message: "No account is waiting for verification with this email. Please sign up again." });
    }
    if (user.isVerified) {
      return res.status(200).json({ success: true, alreadyVerified: true, message: "Your email is already verified. Please log in." });
    }
    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: "Your account has been blocked. Please contact support." });
    }
    if (!user.emailOtp || !user.emailOtpExpiry) {
      return res.status(400).json({ success: false, expired: true, message: "There's no active code for this email. Tap “Resend code” to get a new one." });
    }
    if (user.emailOtpExpiry < new Date()) {
      return res.status(400).json({ success: false, expired: true, message: "This code has expired. Tap “Resend code” to get a new one." });
    }
    if (!sameHash(sha256(otp), user.emailOtp)) {
      user.emailOtpAttempts += 1;
      const attemptsLeft = MAX_OTP_ATTEMPTS - user.emailOtpAttempts;
      if (attemptsLeft <= 0) {
        user.emailOtp = null;
        user.emailOtpExpiry = null;
      }
      await user.save();
      return res.status(400).json({
        success: false,
        attemptsLeft: Math.max(0, attemptsLeft),
        expired: attemptsLeft <= 0,
        message:
          attemptsLeft > 0
            ? `Incorrect code. ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} left.`
            : "Too many incorrect attempts. Tap “Resend code” to get a new one.",
      });
    }

    user.isVerified = true;
    clearEmailOtp(user);
    const session = await startSession(user);
    return res.status(200).json({ success: true, message: `Email verified! Welcome to Ekart, ${user.firstName}.`, ...session });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /resend-email-otp { email }: a new signup code (30s cooldown)
export const resendEmailOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address" });
    }
    const user = await findByEmail(email);
    if (user?.isVerified) {
      return res.status(200).json({ success: true, alreadyVerified: true, message: "This email is already verified. Please log in." });
    }
    if (user) {
      const wait = cooldownLeft(user.emailOtpSentAt, EMAIL_OTP_COOLDOWN_MS);
      if (wait) {
        return res.status(429).json({ success: false, message: `Please wait ${wait}s before requesting another code`, retryAfter: wait });
      }
      if (!(await sendEmailOtp(user))) {
        return res.status(502).json({ success: false, emailFailed: true, message: MAIL_FAILED });
      }
    }
    // same answer whether or not the account exists
    return res.status(200).json({
      success: true,
      message: "If an account is waiting for verification with this email, we've sent it a new code.",
      expiresIn: EMAIL_OTP_TTL_MS / 1000,
      resendIn: EMAIL_OTP_COOLDOWN_MS / 1000,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /change-email { verifyToken, newEmail }: fix a mistyped address on the verify screen.
// Needs the verify token from signup / login, so nobody else can move a pending account to their inbox.
export const changeSignupEmail = async (req, res) => {
  try {
    let decoded;
    try {
      decoded = jwt.verify(String(req.body.verifyToken || ""), process.env.SECRET_KEY);
    } catch {
      decoded = null;
    }
    if (decoded?.purpose !== "verify-email") {
      return res.status(400).json({ success: false, message: "This page has expired. Please sign up again with the right email." });
    }
    const newEmail = normalizeEmail(req.body.newEmail);
    if (!EMAIL_RE.test(newEmail)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address" });
    }
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(400).json({ success: false, message: "Account not found. Please sign up again." });
    }
    if (user.isVerified) {
      return res.status(400).json({ success: false, message: "This account is already verified. Please log in." });
    }
    if (newEmail === user.email.toLowerCase()) {
      return res.status(400).json({ success: false, message: "That's the email we already sent the code to." });
    }
    const taken = await findByEmail(newEmail);
    if (taken) {
      return res.status(400).json({
        success: false,
        message: taken.isVerified
          ? "An account with this email already exists. Please log in instead."
          : "This email is waiting for verification on another sign-up. Please use a different email.",
      });
    }

    user.email = newEmail;
    if (!(await sendEmailOtp(user))) {
      return res.status(502).json({
        success: false,
        emailFailed: true,
        ...codePayload(user, 0),
        message: "Email updated, but we couldn't send the code. Tap “Resend code” to try again.",
      });
    }
    return res.status(200).json({ success: true, message: `Email updated. We've sent a new code to ${user.email}`, ...codePayload(user) });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ success: false, message: "An account with this email already exists. Please use a different email." });
    }
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
    if (existingUser.isBlocked) {
      return res.status(403).json({ success: false, message: "Your account has been blocked. Please contact support." });
    }
    if (existingUser.isVerified === false) {
      // right password but unverified: send a fresh code (unless one just went out) and open the verify screen
      const wait = cooldownLeft(existingUser.emailOtpSentAt, EMAIL_OTP_COOLDOWN_MS);
      const codeSent = wait ? false : await sendEmailOtp(existingUser);
      return res.status(403).json({
        success: false,
        needsVerification: true,
        codeSent,
        ...codePayload(existingUser, codeSent ? EMAIL_OTP_COOLDOWN_MS / 1000 : wait),
        message: codeSent
          ? `Please verify your email first. We've sent a 6-digit code to ${existingUser.email}.`
          : wait
            ? "Please verify your email first. Enter the code we just sent you."
            : `Please verify your email first. ${MAIL_FAILED}`,
      });
    }

    const session = await startSession(existingUser);
    return res.status(200).json({ success: true, message: `Welcome back ${existingUser.firstName}`, ...session });
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
      const sent = await sendOTPMail(otp, user.email);
      if (mailFailed(sent)) {
        // the code never arrived: forget it, so they can ask again straight away
        user.otp = null;
        user.otpExpiry = null;
        user.otpSentAt = null;
        await user.save();
        return res.status(502).json({ success: false, emailFailed: true, message: MAIL_FAILED });
      }
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
    clearEmailOtp(user);
    await user.save();
    return res.status(200).json({ success: true, message: "Password changed successfully. Please log in." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
