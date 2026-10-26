import nodemailer from "nodemailer";
import { CreateContactInput } from "../validators/contact.validators";
import { env } from "../utils/env";
import { logError, logWarning } from "../utils/logger";

export type ContactEmailDeliveryStatus = "sent" | "failed" | "skipped";

export interface ContactEmailDelivery {
  support: ContactEmailDeliveryStatus;
  acknowledgement: ContactEmailDeliveryStatus;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendContactEmail(
  contact: CreateContactInput
): Promise<ContactEmailDelivery> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    logWarning("contact.email.skipped", { reason: "not_configured" });
    return { support: "skipped", acknowledgement: "skipped" };
  }
  if (!Number.isInteger(SMTP_PORT) || SMTP_PORT < 1 || SMTP_PORT > 65535) {
    logWarning("contact.email.skipped", { reason: "invalid_smtp_port" });
    return { support: "skipped", acknowledgement: "skipped" };
  }

  const subject = contact.subject.replace(/[\r\n]+/g, " ").trim();
  const supportMessageText = [
    `Name: ${contact.name}`,
    `Email: ${contact.email}`,
    `Phone: ${contact.phone}`,
    `Subject: ${subject}`,
    "",
    contact.message,
  ].join("\n");
  const supportMessageHtml = `
    <h2>Website contact form submission</h2>
    <p><strong>Name:</strong> ${escapeHtml(contact.name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(contact.email)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(contact.phone)}</p>
    <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
    <p><strong>Message:</strong><br>${escapeHtml(contact.message).replace(/\n/g, "<br>")}</p>
  `;
  const acknowledgementText = [
    `Hello ${contact.name},`,
    "",
    "Thank you for contacting Sky Vision Infra and Developers. We have received your message and our team will get back to you shortly.",
    "",
    `Subject: ${subject}`,
    "",
    "Regards,",
    "Sky Vision Infra and Developers",
  ].join("\n");
  const acknowledgementHtml = `
    <p>Hello ${escapeHtml(contact.name)},</p>
    <p>Thank you for contacting Sky Vision Infra and Developers. We have received your message and our team will get back to you shortly.</p>
    <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
    <p>Regards,<br>Sky Vision Infra and Developers</p>
  `;

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: env.SMTP_SECURE,
      requireTLS: !env.SMTP_SECURE,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 10_000,
      auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    });
    const results = await Promise.allSettled([
      transporter.sendMail({
        from: env.CONTACT_EMAIL_FROM ?? SMTP_USER,
        to: env.CONTACT_EMAIL_TO,
        replyTo: contact.email,
        subject: `Website contact form: ${subject}`,
        text: supportMessageText,
        html: supportMessageHtml,
      }),
      transporter.sendMail({
        from: env.CONTACT_EMAIL_FROM ?? SMTP_USER,
        to: contact.email,
        replyTo: env.CONTACT_EMAIL_TO,
        subject: `We received your message: ${subject}`,
        text: acknowledgementText,
        html: acknowledgementHtml,
      }),
    ]);
    const failures = results.flatMap((result, index) =>
      result.status === "rejected"
        ? [{ error: result.reason, recipient: index === 0 ? "support" : "contact" }]
        : []
    );
    if (failures.length > 0) {
      for (const failure of failures) {
        logError("contact.email.failed", failure.error, { recipient: failure.recipient });
      }
    }
    return {
      support: results[0].status === "fulfilled" ? "sent" : "failed",
      acknowledgement: results[1].status === "fulfilled" ? "sent" : "failed",
    };
  } catch (error) {
    logError("contact.email.failed", error);
    return { support: "failed", acknowledgement: "failed" };
  }
}
