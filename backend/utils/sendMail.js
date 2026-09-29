import nodemailer from "nodemailer";
import "dotenv/config";

export const escapeHtml = (text = "") =>
  String(text).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);

export const isMailConfigured = () => Boolean(process.env.MAIL_USER && process.env.MAIL_PASS);

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

// Fire-and-forget mail helper: resolves true/false and never throws, so a mail outage never breaks a request.
// Without MAIL_USER / MAIL_PASS (e.g. local development) the mail is printed to the server console instead.
export const sendMail = async ({ to, subject, html, replyTo, devNote }) => {
  if (!isMailConfigured()) {
    console.warn(`📧 Mail not sent (MAIL_USER / MAIL_PASS missing in backend/.env): "${subject}" → ${to}`);
    if (devNote && process.env.NODE_ENV !== "production") console.warn(`   ↳ ${devNote}`);
    return false;
  }
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
    await transporter.sendMail({ from: `"Ekart" <${process.env.MAIL_USER}>`, to, subject, html, replyTo });
    console.log(`✅ Mail sent: ${subject} → ${to}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send mail (${subject}):`, error.message);
    if (devNote && process.env.NODE_ENV !== "production") console.warn(`   ↳ ${devNote}`);
    return false;
  }
};
