import nodemailer from "nodemailer";

function siteUrl() {
  return (process.env.SITE_URL || "https://www.alkitabinternationalacademy.com").replace(/\/$/, "");
}

function setting(name) {
  return String(process.env[name] || "").trim().replace(/^["']|["']$/g, "");
}

function mailer() {
  const host = setting("SMTP_HOST");
  const user = setting("SMTP_USER");
  const pass = setting("SMTP_PASS").replace(/\s+/g, "");
  if (!host || !user || !pass) return null;
  const port = Number(setting("SMTP_PORT") || 587);
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function acceptText(record) {
  const link = `${siteUrl()}/admit-card`;
  return [
    `Dear ${record.fullName},`,
    "",
    "Your registration request for the Rahmat-e-Kainat Quiz Competition 2026–27 has been accepted.",
    "",
    `Registration number: ${record.regNumber}`,
    `Mobile number: ${record.mobile}`,
    "",
    "Use this registration number and the same mobile number to open your admit card:",
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
  if (!record.email) return { sent: false, error: "This candidate has no email address." };
  const accepted = record.status === "approved";
  try {
    await transport.sendMail({
      from: {
        name: "Al-Kitab International Quran Academy",
        address: setting("SMTP_USER"),
      },
      to: record.email,
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
