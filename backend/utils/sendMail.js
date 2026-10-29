import "dotenv/config";

// All mail goes through Brevo's HTTPS API (port 443, so Render's SMTP block doesn't matter).
//  BREVO_API_KEY         an API key from Brevo → SMTP & API → API Keys (starts with "xkeysib-")
//  BREVO_VERIFIED_SENDER an address verified in Brevo → Senders; every mail is sent from it
const env = (name) => (process.env[name] || "").trim();
const brevoKey = () => env("BREVO_API_KEY");
const brevoVerifiedSender = () => env("BREVO_VERIFIED_SENDER");

export const isMailConfigured = () => Boolean(brevoKey() && brevoVerifiedSender());

export const escapeHtml = (text = "") =>
  String(text).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);

// Codes may be printed to the console only while developing, never on a live server
// (Render sets RENDER=true), so they can't leak through hosting logs
const isLocalDev = () => process.env.NODE_ENV !== "production" && !process.env.RENDER;

// "ro***70@gmail.com": enough to recognise the address in logs without printing it in full
const maskEmail = (email = "") => {
  const [name, domain] = String(email).split("@");
  if (!domain) return email ? "(not an email)" : "(empty)";
  return `${name.slice(0, 2)}***${name.length > 4 ? name.slice(-2) : ""}@${domain}`;
};

// Setup mistakes worth a warning at startup
const setupWarnings = () => {
  const warnings = [];
  if (!brevoKey()) warnings.push("BREVO_API_KEY is missing.");
  else if (brevoKey().startsWith("xsmtpsib-")) {
    warnings.push('BREVO_API_KEY is an SMTP key ("xsmtpsib-…"), which Brevo\'s API rejects. Create an API key (Brevo → SMTP & API → API Keys → Generate, starts with "xkeysib-") and use that.');
  } else if (!brevoKey().startsWith("xkeysib-")) {
    warnings.push(`BREVO_API_KEY doesn't start with "xkeysib-" (it starts with "${brevoKey().slice(0, 6)}…"): copy the API key again, without extra text in front.`);
  }
  if (!brevoVerifiedSender()) warnings.push("BREVO_VERIFIED_SENDER is missing (the address mail is sent from).");
  return warnings;
};

// A plain-language reason for the logs
const explain = (error) => {
  const text = `${error?.message || ""} ${error?.code || ""}`;
  if (/Brevo 401|Key not found|unauthorized/i.test(text)) {
    return 'Brevo rejected BREVO_API_KEY. It must be an API key ("xkeysib-…" from Brevo → SMTP & API → API Keys), not an SMTP key ("xsmtpsib-…").';
  }
  if (/sender|not.*verified/i.test(text)) {
    return `Brevo won't send from ${maskEmail(brevoVerifiedSender())}. Add and verify it under Brevo → Senders, Domains & Dedicated IPs → Senders.`;
  }
  if (/unrecogni[sz]ed IP|IP address/i.test(text)) {
    return "Brevo blocked this server's IP. Turn off Brevo → Security → Authorised IPs (Render's IPs change).";
  }
  if (/not.*activated|account.*(suspended|review)|permission_denied/i.test(text)) {
    return "Brevo hasn't activated this account for transactional email yet. Check the banner in your Brevo dashboard or contact Brevo support.";
  }
  if (/timeout|aborted|fetch failed|ENOTFOUND|ECONNRESET/i.test(text)) return "Couldn't reach api.brevo.com. Check the server's internet access and try again.";
  return "See the error above.";
};

const logFailure = (subject, to, error) => {
  console.error(`❌ MAIL FAILED: "${subject}" → ${maskEmail(to)}`);
  console.error(`   sender:   ${maskEmail(brevoVerifiedSender())} (BREVO_VERIFIED_SENDER)`);
  console.error(`   error:    ${error?.message || error}`);
  console.error(`   fix:      ${explain(error)}`);
};

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
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n\n")
    .trim();

// Calls Brevo's API; throws with Brevo's own message when it refuses
const brevoRequest = async (path, options = {}) => {
  const res = await fetch(`https://api.brevo.com/v3${path}`, {
    ...options,
    headers: { "api-key": brevoKey(), "content-type": "application/json", accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(`Brevo ${res.status}: ${body.message || res.statusText}`);
    error.code = body.code;
    error.responseCode = res.status;
    throw error;
  }
  return body;
};

const sendWithBrevo = ({ to, subject, html, text, replyTo }) =>
  brevoRequest("/smtp/email", {
    method: "POST",
    body: JSON.stringify({
      sender: { name: "Ekart", email: brevoVerifiedSender() },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
      ...(replyTo ? { replyTo: { email: replyTo } } : {}),
    }),
  });

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
// Without Brevo settings (e.g. local development) the mail is printed to the server console instead.
export const sendMail = async ({ to, subject, html, replyTo, devNote }) => {
  if (!isMailConfigured()) {
    console.warn(`📧 Mail not sent (BREVO_API_KEY or BREVO_VERIFIED_SENDER missing): "${subject}" → ${maskEmail(to)}`);
    if (devNote && isLocalDev()) console.warn(`   ↳ ${devNote}`);
    return false;
  }
  const started = Date.now();
  try {
    const { messageId } = await sendWithBrevo({ to, subject, html, text: htmlToText(html), replyTo });
    // Brevo accepted it; if it then doesn't arrive, Brevo → Transactional → Logs shows what happened to this id
    console.log(`✅ Mail sent (Brevo API, ${Date.now() - started} ms): "${subject}" → ${maskEmail(to)} · ${messageId || "no id"}`);
    return true;
  } catch (error) {
    logFailure(subject, to, error);
    console.error(`   took:     ${Date.now() - started} ms`);
    if (devNote && isLocalDev()) console.warn(`   ↳ ${devNote}`);
    return false;
  }
};

// Run once when the server starts: says in the logs whether email will work, and why not.
// Doesn't send anything; it reads the Brevo account with the key.
export const checkMailSetup = async () => {
  for (const warning of setupWarnings()) console.warn(`⚠️  Mail check: ${warning}`);
  if (!isMailConfigured()) {
    console.warn("📧 Mail check: not configured. Codes are printed here instead of emailed.");
    return;
  }
  console.log(`📧 Mail check: Brevo API · sender ${maskEmail(brevoVerifiedSender())} · BREVO_API_KEY set (${brevoKey().length} characters)`);
  const started = Date.now();
  try {
    await brevoRequest("/account");
    console.log(`📧 Mail check: OK (${Date.now() - started} ms). Signup codes and password resets can be emailed.`);
  } catch (error) {
    console.error(`❌ Mail check FAILED: ${error.message}`);
    console.error(`   fix:      ${explain(error)}`);
  }
};
