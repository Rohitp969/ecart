// Helpers for the signup / verification / password-reset screens

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const MIN_PASSWORD = 6;

// 0–4 score + label for the strength meter
export const passwordStrength = (password = "") => {
  if (password.length < MIN_PASSWORD) return { score: 0, label: password ? "Too short" : "" };
  let score = 1;
  if (password.length >= 10) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  score = Math.min(4, score);
  return { score, label: ["Too short", "Weak", "Fair", "Good", "Strong"][score] };
};

// readable message for a failed auth request
export const authErrorMessage = (error, fallback = "Something went wrong. Please try again.") =>
  error?.response?.data?.message || (error?.request ? "Can't reach the server. Please check your connection and try again." : fallback);

// The reset flow spans three pages; router state is lost on refresh, so keep a copy for this tab
const RESET_KEY = "ekart-password-reset";

export const readResetState = () => {
  try {
    return JSON.parse(sessionStorage.getItem(RESET_KEY)) || {};
  } catch {
    return {};
  }
};

export const saveResetState = (patch) => {
  try {
    sessionStorage.setItem(RESET_KEY, JSON.stringify({ ...readResetState(), ...patch }));
  } catch {
    // private mode etc.: the flow still works within the same page session
  }
};

export const clearResetState = () => {
  try {
    sessionStorage.removeItem(RESET_KEY);
  } catch {
    // ignore
  }
};

// seconds left of the 60s resend cooldown, from when the last mail was sent
export const cooldownFrom = (sentAt, seconds = 60) =>
  sentAt ? Math.max(0, Math.ceil((sentAt + seconds * 1000 - Date.now()) / 1000)) : 0;

// The email-verification screen (after signup, or logging in unverified) keeps its email, verify token
// and timers for this tab, so a refresh doesn't lose them
const VERIFY_KEY = "ekart-email-verify";

export const readVerifyState = () => {
  try {
    return JSON.parse(sessionStorage.getItem(VERIFY_KEY)) || {};
  } catch {
    return {};
  }
};

export const saveVerifyState = (patch) => {
  const next = { ...readVerifyState(), ...patch };
  try {
    sessionStorage.setItem(VERIFY_KEY, JSON.stringify(next));
  } catch {
    // private mode etc.: the screen still works until a refresh
  }
  return next;
};

export const clearVerifyState = () => {
  try {
    sessionStorage.removeItem(VERIFY_KEY);
  } catch {
    // ignore
  }
};

// From an API answer that (re)sent a code: when it expires and when another may be requested.
// codeSent false = nothing went out now (mail failed, or an earlier code is still on its way).
export const codeTimers = (data, codeSent = true) => ({
  ...(codeSent ? { expiresAt: Date.now() + (data.expiresIn ?? 300) * 1000 } : {}),
  resendAt: Date.now() + (data.resendIn ?? 30) * 1000,
});

// whole seconds until a timestamp (0 once it has passed)
export const secondsUntil = (time) => (time ? Math.max(0, Math.ceil((time - Date.now()) / 1000)) : 0);
