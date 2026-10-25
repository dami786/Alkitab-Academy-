import dns from "node:dns";
import nodemailer from "nodemailer";

dns.setDefaultResultOrder("ipv4first");

function siteUrl() {
  return (process.env.SITE_URL || "https://www.alkitabinternationalacademy.com").replace(/\/$/, "");
}

function setting(name) {
  return String(process.env[name] || "").trim().replace(/^["']|["']$/g, "");
}

function smtpAuth() {
  return {
    host: setting("SMTP_HOST") || "smtp.gmail.com",
    user: setting("SMTP_USER"),
    pass: setting("SMTP_PASS").replace(/\s+/g, ""),
    fromName: "Al-Kitab International Quran Academy",
  };
}

function smtpReady() {
  const { user, pass } = smtpAuth();
  return Boolean(user && pass);
}

function httpsReady() {
  return Boolean(setting("RESEND_API_KEY") || setting("BREVO_API_KEY"));
}

function createSmtpTransport(port) {
  const { host, user, pass } = smtpAuth();
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth: { user, pass },
    family: 4,
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 25000,
    tls: {
      minVersion: "TLSv1.2",
      servername: host,
    },
  });
}

function smtpPorts() {
  const preferred = Number(setting("SMTP_PORT") || 587);
  return [...new Set([preferred, 465, 587])].filter((port) => Number.isInteger(port) && port > 0);
}

let transport;

function resetSmtp() {
  if (!transport) return;
  try {
    transport.close();
  } catch {
    // The next accept/reject should open a fresh connection.
  }
  transport = null;
}

async function connectSmtp() {
  if (transport) return transport;
  let lastError;
  for (const port of smtpPorts()) {
    const candidate = createSmtpTransport(port);
    try {
      await candidate.verify();
      transport = candidate;
      console.log(`Decision email is ready on ${smtpAuth().host}:${port}.`);
      return transport;
    } catch (error) {
      lastError = error;
      console.error(`Decision email cannot connect on port ${port}:`, String(error.message).slice(0, 180));
      try {
        candidate.close();
      } catch {
        // Try the next SMTP port.
      }
    }
  }
  throw lastError || new Error("Could not connect to the mail server.");
}

async function sendWithResend({ to, subject, text }) {
  const key = setting("RESEND_API_KEY");
  if (!key) return false;
  const { user, fromName } = smtpAuth();
  const from = setting("MAIL_FROM") || `${fromName} <${user}>`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, text }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error((body || `Resend returned ${response.status}`).slice(0, 180));
  }
  return true;
}

async function sendWithBrevo({ to, subject, text }) {
  const key = setting("BREVO_API_KEY");
  if (!key) return false;
  const { user, fromName } = smtpAuth();
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": key,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: fromName, email: user },
      to: [{ email: to }],
      subject,
      textContent: text,
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error((body || `Brevo returned ${response.status}`).slice(0, 180));
  }
  return true;
}

export function prepareMail() {
  if (httpsReady()) {
    console.log("Decision email will send over HTTPS.");
    return Promise.resolve(true);
  }
  if (!smtpReady()) {
    console.log("Decision email is not configured.");
    return Promise.resolve(false);
  }
  return connectSmtp()
    .then(() => true)
    .catch(() => false);
}

function acceptText(record) {
  const regNumber = String(record.regNumber || "").trim();
  const mobile = String(record.mobile || "").replace(/\D/g, "");
  const link = `${siteUrl()}/admit-card?reg=${encodeURIComponent(regNumber)}&mobile=${encodeURIComponent(mobile)}`;
  return [
    `Dear ${record.fullName},`,
    "",
    "Your registration request for the Rahmat-e-Kainat Quiz Competition 2026–27 has been accepted.",
    "",
    `Registration number: ${regNumber}`,
    `Mobile number: ${mobile}`,
    "",
    "These are the same registration number and mobile number from your form. Open your admit card with this link:",
    link,
    "",
    "If your roll number slip is not on the page yet, please check again in a few days.",
    "",
    "Al-Kitab International Quran Academy",
  ].join("\n");
}

function rejectText(record) {
  const lines = [
    `Dear ${record.fullName},`,
    "",
    "Your registration request for the Rahmat-e-Kainat Quiz Competition 2026–27 was not accepted.",
    "",
    `Registration number: ${record.regNumber}`,
  ];
  if (record.adminNote) {
    lines.push("", `Note from the academy: ${record.adminNote}`);
  }
  lines.push("", "Al-Kitab International Quran Academy");
  return lines.join("\n");
}

export async function sendDecisionEmail(record) {
  if (!smtpReady() && !httpsReady()) {
    return { sent: false, error: "Email is not configured on the server." };
  }
  const to = String(record.email || "").trim();
  if (!to) return { sent: false, error: "This candidate has no email address." };
  const accepted = record.status === "approved";
  const payload = {
    to,
    subject: accepted
      ? "Your Rahmat-e-Kainat Quiz registration has been accepted"
      : "Your Rahmat-e-Kainat Quiz registration was not accepted",
    text: accepted ? acceptText(record) : rejectText(record),
  };
  try {
    if (await sendWithResend(payload)) return { sent: true, error: "" };
    if (await sendWithBrevo(payload)) return { sent: true, error: "" };
    const mailer = await connectSmtp();
    const { user, fromName } = smtpAuth();
    await mailer.sendMail({
      from: { name: fromName, address: user },
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
    });
    return { sent: true, error: "" };
  } catch (error) {
    resetSmtp();
    const detail = String(error?.response || error?.message || "Mail server rejected the message").slice(0, 180);
    console.error("Decision email failed", detail);
    return { sent: false, error: detail };
  }
}
