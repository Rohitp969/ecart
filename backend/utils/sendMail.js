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
    throw new Error(`Brevo ${res.status}: ${body.message || res.statusText}`);
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
    console.warn(`📧 Mail not sent (no BREVO_API_KEY or MAIL_USER / MAIL_PASS in backend/.env): "${subject}" → ${to}`);
    if (devNote && process.env.NODE_ENV !== "production") console.warn(`   ↳ ${devNote}`);
    return false;
  }
  try {
    const text = htmlToText(html);
    if (useBrevo()) {
      await sendWithBrevo({ to, subject, html, text, replyTo });
      console.log(`✅ Mail sent (Brevo): ${subject} → ${to}`);
    } else {
      const info = await gmailTransport().sendMail({ from: `"Ekart" <${senderEmail()}>`, to, subject, html, text, replyTo });
      // Gmail's reply ("250 2.0.0 OK …") means it accepted the mail; if it then doesn't show up, look in Spam
      console.log(`✅ Mail sent (Gmail): ${subject} → ${to} · ${info.response}`);
    }
    return true;
  } catch (error) {
    console.error(`❌ Failed to send mail (${subject}):`, error.message);
    if (devNote && process.env.NODE_ENV !== "production") console.warn(`   ↳ ${devNote}`);
    return false;
  }
};
