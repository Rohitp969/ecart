// Frontends allowed to call the API (also used for CORS in server.js)
export const ALLOWED_ORIGINS = [
  /^http:\/\/(localhost|127\.0\.0\.1):\d+$/, // any local dev port (Vite moves to 5174, 5175... when 5173 is busy)
  "https://ecart-silk-six.vercel.app",
];

const isAllowedOrigin = (origin) =>
  ALLOWED_ORIGINS.some((allowed) => (allowed instanceof RegExp ? allowed.test(origin) : allowed === origin));

// Base URL for links in emails: CLIENT_URL if set, else the (allowed) site the request came from,
// so verification links point at whichever frontend the user signed up on.
export const clientUrl = (req) => {
  if (process.env.CLIENT_URL) return process.env.CLIENT_URL.replace(/\/+$/, "");
  const origin = req?.get?.("origin");
  if (origin && isAllowedOrigin(origin)) return origin;
  return "http://localhost:5173";
};
