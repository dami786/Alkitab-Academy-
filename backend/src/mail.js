import nodemailer from "nodemailer";

function siteUrl() {
  return (process.env.SITE_URL || "https://www.alkitabinternationalacademy.com").replace(/\/$/, "");
}

function setting(name) {
  return String(process.env[name] || "").trim().replace(/^["']|["']$/g, "");
}

let transport;

function mailer() {
  if (transport) return transport;
  const host = setting("SMTP_HOST");
  const user = setting("SMTP_USER");
  const pass = setting("SMTP_PASS").replace(/\s+/g, "");
  if (!host || !user || !pass) return null;
  const port = Number(setting("SMTP_PORT") || 587);
  transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: { user, pass },
    pool: true,
    maxConnections: 3,
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 12000,
  });
  return transport;
}

export function prepareMail() {
  const ready = mailer();
  if (!ready) {
    console.log("Decision email is not configured.");
    return Promise.resolve(false);
  }
  return ready.verify().then(() => {
    console.log("Decision email is ready.");
    return true;
  }).catch((error) => {
    console.error("Decision email cannot connect:", String(error.message).slice(0, 180));
    return false;
  });
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
  const transport = mailer();
  if (!transport) return { sent: false, error: "Email is not configured on the server." };
  const to = String(record.email || "").trim();
  if (!to) return { sent: false, error: "This candidate has no email address." };
  const accepted = record.status === "approved";
  try {
    await transport.sendMail({
      from: {
        name: "Al-Kitab International Quran Academy",
        address: setting("SMTP_USER"),
      },
      to,
      subject: accepted
        ? "Your Rahmat-e-Kainat Quiz registration has been accepted"
        : "Your Rahmat-e-Kainat Quiz registration was not accepted",
      text: accepted ? acceptText(record) : rejectText(record),
    });
    return { sent: true, error: "" };
  } catch (error) {
    const detail = String(error?.response || error?.message || "Mail server rejected the message").slice(0, 180);
    console.error("Decision email failed", detail);
    return { sent: false, error: detail };
  }
}
