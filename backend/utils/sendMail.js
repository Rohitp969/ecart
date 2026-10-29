import nodemailer from "nodemailer";
import "dotenv/config";

export const escapeHtml = (text = "") =>
  String(text).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);

// Two ways to send:
//  - BREVO_API_KEY set: Brevo's HTTPS API. Use this on hosts that block SMTP (Render's free plan blocks ports 25/465/587).
//  - otherwise MAIL_USER + MAIL_PASS: Gmail over SMTP (fine locally and on paid hosting).
const useBrevo = () => Boolean(process.env.BREVO_API_KEY);
const senderEmail = () => process.env.MAIL_FROM || process.env.MAIL_USER;

export const isMailConfigured = () =>
  useBrevo() ? Boolean(senderEmail()) : Boolean(process.env.MAIL_USER && process.env.MAIL_PASS);

// Codes and links may be printed to the console only while developing, never on a live server
// (Render sets RENDER=true), so they can't leak through hosting logs
const isLocalDev = () => process.env.NODE_ENV !== "production" && !process.env.RENDER;

// "ro***70@gmail.com": enough to recognise the address in logs without printing it in full
const maskEmail = (email = "") => {
  const [name, domain] = String(email).split("@");
  if (!domain) return email ? "(not an email)" : "(empty)";
  return `${name.slice(0, 2)}***${name.length > 4 ? name.slice(-2) : ""}@${domain}`;
};

// What the server will send with, for the logs; secrets only as "set (N characters)"
const describeSetup = () =>
  useBrevo()
    ? `Brevo API · sender ${maskEmail(senderEmail())} · BREVO_API_KEY set (${process.env.BREVO_API_KEY.length} characters)`
    : `Gmail SMTP · MAIL_USER ${maskEmail(process.env.MAIL_USER)} · MAIL_PASS ${
        process.env.MAIL_PASS ? `set (${process.env.MAIL_PASS.replace(/\s/g, "").length} characters, a Gmail app password has 16)` : "missing"
      }`;

// Plain-language reason + fix for the errors seen in practice
const explain = (error) => {
  const text = `${error.code || ""} ${error.responseCode || ""} ${error.message || ""}`;
  if (/ETIMEDOUT|ESOCKET|ECONNECTION|ECONNREFUSED|ECONNRESET|EHOSTUNREACH|ENETUNREACH|Greeting never received|Connection timeout/i.test(text) && !useBrevo()) {
    return "Can't reach Gmail's mail server. Render's free plan blocks SMTP ports 25/465/587, so Gmail can't be used there. Set BREVO_API_KEY (free at brevo.com) to send over HTTPS instead.";
  }
  if (/EAUTH|535|534|Invalid login|Username and Password not accepted|Application-specific password/i.test(text)) {
    return "Gmail rejected the login. MAIL_PASS must be a 16-character Google App Password for MAIL_USER (Google Account → Security → 2-Step Verification → App passwords), not the normal Gmail password. Remove spaces.";
  }
  if (/Brevo 401|Key not found|unauthorized/i.test(text)) return "Brevo rejected the API key. Check BREVO_API_KEY (Brevo → SMTP & API → API keys).";
  if (/Brevo 400.*sender|sender.*not.*valid|not.*verified/i.test(text)) {
    return `Brevo won't send from ${maskEmail(senderEmail())} yet. Add and verify it under Brevo → Senders, or set MAIL_FROM to a verified sender.`;
  }
  if (/Brevo 403/i.test(text)) return "Brevo refused the request (account not activated, or the server's IP isn't allowed). Check Brevo → Security → Authorised IPs.";
  if (/ENOTFOUND|EAI_AGAIN/i.test(text)) return "DNS lookup failed: the server couldn't find the mail service. Usually a temporary network problem.";
  if (/TimeoutError|aborted/i.test(text)) return "The mail service didn't answer within 15 seconds. Usually temporary; try again.";
  return "Unexpected mail error: see the details above.";
};

// Full picture of a failed send, for the server logs (Render → your service → Logs)
const logFailure = (subject, to, error) => {
  console.error(`❌ MAIL FAILED: "${subject}" → ${maskEmail(to)}`);
  console.error(`   using:    ${describeSetup()}`);
  console.error(`   error:    ${error.message}`);
  const details = [
    error.code && `code=${error.code}`,
    error.command && `command=${error.command}`,
    error.responseCode && `responseCode=${error.responseCode}`,
  ].filter(Boolean);
  if (details.length) console.error(`   details:  ${details.join(" · ")}`);
  if (error.response) console.error(`   server said: ${String(error.response).slice(0, 300)}`);
  console.error(`   fix:      ${explain(error)}`);
};

// Gmail SMTP; short timeouts so a blocked port fails in seconds instead of hanging the request
let gmail;
const gmailTransport = () =>
  (gmail ??= nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  }));

// Plain-text copy of an HTML mail. Sending both is what mail providers expect; HTML-only mail is
// more likely to be filed as spam.
const htmlToText = (html) =>
  html
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, label) => {
      const text = label.replace(/<[^>]+>/g, "").trim();
      return text && text !== href ? `${text}: ${href}` : href;
    })
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h1|h2|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const sendWithBrevo = async ({ to, subject, html, text, replyTo }) => {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": process.env.BREVO_API_KEY, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { name: "Ekart", email: senderEmail() },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
      ...(replyTo ? { replyTo: { email: replyTo } } : {}),
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const error = new Error(`Brevo ${res.status}: ${body.message || res.statusText}`);
    error.code = body.code;
    error.responseCode = res.status;
    throw error;
  }
};

// Branded HTML wrapper shared by every email
export const emailLayout = ({ title, intro, button, outro = "" }) => `
<div style="background:#f9fafb;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#111827">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;border:1px solid #f3f4f6">
    <p style="margin:0 0 24px;font-size:22px;font-weight:800;color:#db2777">Ekart</p>
    <h1 style="margin:0 0 12px;font-size:20px">${title}</h1>
    <div style="font-size:15px;line-height:1.6;color:#374151">${intro}</div>
    ${
      button
        ? `<p style="margin:28px 0"><a href="${button.href}" style="background:#db2777;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:700;display:inline-block">${button.label}</a></p>
           <p style="font-size:12px;color:#6b7280">Button not working? Copy this link into your browser:<br><a href="${button.href}" style="color:#db2777;word-break:break-all">${button.href}</a></p>`
        : ""
    }
    ${outro ? `<div style="font-size:13px;color:#6b7280;margin-top:20px">${outro}</div>` : ""}
  </div>
  <p style="text-align:center;font-size:12px;color:#9ca3af;margin-top:16px">© ${new Date().getFullYear()} Ekart. You're receiving this because of activity on your Ekart account.</p>
</div>`;

// Mail helper: resolves true/false and never throws, so a mail outage never crashes a request.
// Callers that depend on the mail (signup, password reset) check the result and tell the user.
// Without mail settings (e.g. local development) the mail is printed to the server console instead.
export const sendMail = async ({ to, subject, html, replyTo, devNote }) => {
  if (!isMailConfigured()) {
    console.warn(`📧 Mail not sent (no BREVO_API_KEY, or MAIL_USER / MAIL_PASS missing): "${subject}" → ${maskEmail(to)}`);
    if (devNote && isLocalDev()) console.warn(`   ↳ ${devNote}`);
    return false;
  }
  const started = Date.now();
  try {
    const text = htmlToText(html);
    if (useBrevo()) {
      await sendWithBrevo({ to, subject, html, text, replyTo });
      console.log(`✅ Mail sent (Brevo, ${Date.now() - started} ms): "${subject}" → ${maskEmail(to)}`);
    } else {
      const info = await gmailTransport().sendMail({ from: `"Ekart" <${senderEmail()}>`, to, subject, html, text, replyTo });
      // Gmail's reply ("250 2.0.0 OK …") means it accepted the mail; if it then doesn't show up, look in Spam
      console.log(`✅ Mail sent (Gmail, ${Date.now() - started} ms): "${subject}" → ${maskEmail(to)} · ${info.response}`);
    }
    return true;
  } catch (error) {
    logFailure(subject, to, error);
    console.error(`   took:     ${Date.now() - started} ms`);
    if (devNote && isLocalDev()) console.warn(`   ↳ ${devNote}`);
    return false;
  }
};

// Run once when the server starts: says in the logs whether email will work, and why not.
// Doesn't send anything; Gmail is checked with an SMTP login, Brevo by reading the account.
export const checkMailSetup = async () => {
  if (!isMailConfigured()) {
    console.warn("📧 Mail check: not configured (set BREVO_API_KEY, or MAIL_USER + MAIL_PASS). Codes and links are printed here instead of emailed.");
    return;
  }
  console.log(`📧 Mail check: ${describeSetup()}`);
  const started = Date.now();
  try {
    if (useBrevo()) {
      const res = await fetch("https://api.brevo.com/v3/account", {
        headers: { "api-key": process.env.BREVO_API_KEY, accept: "application/json" },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const error = new Error(`Brevo ${res.status}: ${body.message || res.statusText}`);
        error.responseCode = res.status;
        throw error;
      }
    } else {
      await gmailTransport().verify();
    }
    console.log(`📧 Mail check: OK (${Date.now() - started} ms). Signup codes and password resets can be emailed.`);
  } catch (error) {
    logFailure("startup mail check", senderEmail(), error);
    console.error(`   took:     ${Date.now() - started} ms`);
  }
};
