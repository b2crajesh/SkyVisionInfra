import nodemailer from "nodemailer";
import { env } from "../utils/env";
import { logError } from "../utils/logger";

export async function sendAdminPasswordRecoveryEmail(
  resetUrl: string
): Promise<boolean> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, ADMIN_RECOVERY_EMAIL } = env;
  if (
    !SMTP_HOST ||
    !SMTP_USER ||
    !SMTP_PASSWORD ||
    !ADMIN_RECOVERY_EMAIL ||
    !Number.isInteger(SMTP_PORT) ||
    SMTP_PORT < 1 ||
    SMTP_PORT > 65535
  ) {
    logError(
      "auth.admin_password_recovery.email_not_configured",
      new Error("SMTP or admin recovery email configuration is incomplete")
    );
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: env.SMTP_SECURE,
      requireTLS: !env.SMTP_SECURE,
      connectionTimeout: 10_000,
      socketTimeout: 10_000,
      auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    });
    await transporter.sendMail({
      from: env.CONTACT_EMAIL_FROM || SMTP_USER,
      to: ADMIN_RECOVERY_EMAIL,
      subject: "Admin password reset",
      text: [
        "A password reset was requested for the Sky Vision Infra admin account.",
        "",
        `Use this one-time link within 30 minutes: ${resetUrl}`,
        "",
        "If you did not request this reset, you can ignore this email.",
      ].join("\n"),
      html: `
        <p>A password reset was requested for the Sky Vision Infra admin account.</p>
        <p><a href="${resetUrl}">Reset admin password</a></p>
        <p>This one-time link expires in 30 minutes. If you did not request this reset, you can ignore this email.</p>
      `,
    });
    return true;
  } catch (err) {
    logError("auth.admin_password_recovery.email_failed", err);
    return false;
  }
}
