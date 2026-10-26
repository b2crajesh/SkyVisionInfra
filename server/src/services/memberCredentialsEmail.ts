import nodemailer from "nodemailer";
import { env } from "../utils/env";
import { logError, logWarning } from "../utils/logger";
import type { CredentialDeliveryStatus } from "./whatsapp";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendMemberCredentialsEmail(
  email: string,
  name: string,
  userId: string,
  tempPassword: string
): Promise<CredentialDeliveryStatus> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    logWarning("member.credentials.email.skipped", { reason: "not_configured" });
    return "skipped";
  }
  if (!Number.isInteger(SMTP_PORT) || SMTP_PORT < 1 || SMTP_PORT > 65535) {
    logWarning("member.credentials.email.skipped", { reason: "invalid_smtp_port" });
    return "skipped";
  }

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: env.SMTP_SECURE,
      requireTLS: !env.SMTP_SECURE,
      auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    });
    await transporter.sendMail({
      from: env.CONTACT_EMAIL_FROM || SMTP_USER,
      to: email,
      subject: "Your Sky Vision Infra member login credentials",
      text: [
        `Hello ${name},`,
        "",
        "Your member account has been created. Use the credentials below to sign in:",
        `User ID: ${userId}`,
        `Temporary password: ${tempPassword}`,
        "",
        "You will be asked to change your password after signing in.",
        "",
        "Sky Vision Infra and Developers",
      ].join("\n"),
      html: `
        <p>Hello ${escapeHtml(name)},</p>
        <p>Your member account has been created. Use the credentials below to sign in:</p>
        <p><strong>User ID:</strong> ${escapeHtml(userId)}<br>
        <strong>Temporary password:</strong> ${escapeHtml(tempPassword)}</p>
        <p>You will be asked to change your password after signing in.</p>
        <p>Sky Vision Infra and Developers</p>
      `,
    });
    return "sent";
  } catch (err) {
    logError("member.credentials.email.failed", err);
    return "failed";
  }
}
