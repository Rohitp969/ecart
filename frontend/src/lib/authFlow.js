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
