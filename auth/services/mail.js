import nodemailer from "nodemailer";

let transporter;

/**
 * Lazily create SMTP transport from env.
 * Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS; optional SMTP_SECURE, SMTP_FROM.
 */
export function getMailTransporter() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  if (!host || !user) {
    return null;
  }
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 587);
    const secure =
      process.env.SMTP_SECURE === "true" || process.env.SMTP_SECURE === "1" || port === 465;
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass: process.env.SMTP_PASS ?? "",
      },
    });
  }
  return transporter;
}

/**
 * @throws {Error} if SMTP is not configured or send fails
 */
export async function sendPasswordResetEmail(to, resetUrl) {
  const from =
    process.env.SMTP_FROM?.trim() ||
    process.env.SMTP_USER?.trim() ||
    "noreply@localhost";
  const t = getMailTransporter();
  if (!t) {
    console.error(
      "[mail] SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS. Reset URL would be:",
      resetUrl
    );
    throw new Error(
      "Email is not configured on the server. Contact support or try again later."
    );
  }
  await t.sendMail({
    from: `"${process.env.SMTP_FROM_NAME || "Service Marketplace"}" <${from}>`,
    to,
    subject: "Reset your password",
    text: `You requested a password reset.\n\nOpen this link to choose a new password:\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
    html: `<p>You requested a password reset.</p><p><a href="${resetUrl}">Reset your password</a></p><p>If you did not request this, you can ignore this email.</p>`,
  });
}
