import nodemailer from "nodemailer";
import { CreateContactInput } from "../validators/contact.validators";
import { env } from "../utils/env";
import { logError, logInfo, logWarning } from "../utils/logger";

export type ContactEmailDeliveryStatus = "sent" | "failed" | "skipped";

export interface ContactEmailDelivery {
  support: ContactEmailDeliveryStatus;
  acknowledgement: ContactEmailDeliveryStatus;
}

function redactDiagnostic(value: string, sensitiveValues: string[]): string {
  let redacted = value;
  for (const sensitiveValue of sensitiveValues) {
    if (sensitiveValue) {
      redacted = redacted.replace(
        new RegExp(sensitiveValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"),
        "[REDACTED]"
      );
    }
  }
  return redacted.replace(
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    "[REDACTED_EMAIL]"
  );
}

function getSmtpErrorDetails(error: unknown, sensitiveValues: string[]): object {
  if (typeof error !== "object" || error === null) {
    return { message: redactDiagnostic(String(error), sensitiveValues) };
  }

  const details: Record<string, string | number> = {};
  for (const key of [
    "name",
    "message",
    "code",
    "command",
    "responseCode",
    "response",
    "syscall",
    "errno",
    "address",
    "port",
    "host",
  ]) {
    const value = Reflect.get(error, key);
    if (typeof value === "string") {
      details[key] = redactDiagnostic(value, sensitiveValues);
    } else if (typeof value === "number") {
      details[key] = value;
    }
  }
  return details;
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
    const sensitiveValues = [SMTP_USER, SMTP_PASSWORD, contact.email];
    const send = async (
      recipient: "support" | "contact",
      options: Parameters<typeof transporter.sendMail>[0]
    ) => {
      const startedAt = Date.now();
      const smtpDetails = {
        recipient,
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: env.SMTP_SECURE,
      };
      logInfo("contact.email.attempt_started", smtpDetails);
      try {
        await transporter.sendMail(options);
        logInfo("contact.email.sent", {
          ...smtpDetails,
          durationMs: Date.now() - startedAt,
        });
      } catch (error) {
        logError("contact.email.failed", new Error("SMTP delivery failed"), {
          ...smtpDetails,
          durationMs: Date.now() - startedAt,
          smtpError: getSmtpErrorDetails(error, sensitiveValues),
        });
        throw error;
      }
    };
    const results = await Promise.allSettled([
      send("support", {
        from: env.CONTACT_EMAIL_FROM ?? SMTP_USER,
        to: env.CONTACT_EMAIL_TO,
        replyTo: contact.email,
        subject: `Website contact form: ${subject}`,
        text: supportMessageText,
        html: supportMessageHtml,
      }),
      send("contact", {
        from: env.CONTACT_EMAIL_FROM ?? SMTP_USER,
        to: contact.email,
        replyTo: env.CONTACT_EMAIL_TO,
        subject: `We received your message: ${subject}`,
        text: acknowledgementText,
        html: acknowledgementHtml,
      }),
    ]);
    return {
      support: results[0].status === "fulfilled" ? "sent" : "failed",
      acknowledgement: results[1].status === "fulfilled" ? "sent" : "failed",
    };
  } catch (error) {
    logError("contact.email.failed", new Error("SMTP transport setup failed"), {
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: env.SMTP_SECURE,
      smtpError: getSmtpErrorDetails(error, [SMTP_USER, SMTP_PASSWORD, contact.email]),
    });
    return { support: "failed", acknowledgement: "failed" };
  }
}
