import nodemailer from "nodemailer";

function siteUrl() {
  return (process.env.SITE_URL || "https://www.alkitabinternationalacademy.com").replace(/\/$/, "");
}

function mailer() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  const port = Number(process.env.SMTP_PORT || 587);
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465 || process.env.SMTP_SECURE === "true",
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
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: record.email,
      subject: accepted
        ? "Your Rahmat-e-Kainat Quiz registration has been accepted"
        : "Your Rahmat-e-Kainat Quiz registration was not accepted",
      text: accepted ? acceptText(record) : rejectText(record),
    });
    return { sent: true, error: "" };
  } catch {
    console.error("Decision email failed");
    return { sent: false, error: "The email could not be sent. Check the mail settings on the server." };
  }
}
