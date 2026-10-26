import { env } from "../utils/env";
import { logError, logWarning } from "../utils/logger";

export type CredentialDeliveryStatus = "sent" | "failed" | "skipped";

export function isWhatsAppConfigured(): boolean {
  return Boolean(env.WHATSAPP_ACCESS_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID);
}

export function toE164(phone: string, defaultCountryCode: string = env.WHATSAPP_DEFAULT_COUNTRY_CODE): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${defaultCountryCode}${digits}`;
  }
  if (digits.length > 10 && digits.startsWith(defaultCountryCode)) {
    return digits;
  }
  if (digits.length >= 11 && digits.length <= 15) {
    return digits;
  }
  return null;
}

export async function sendMemberCredentialsWhatsApp(
  phone: string | null | undefined,
  userId: string,
  tempPassword: string
): Promise<CredentialDeliveryStatus> {
  if (!phone) {
    return "skipped";
  }

  if (!isWhatsAppConfigured()) {
    logWarning("member.credentials.whatsapp.skipped", { reason: "not_configured" });
    return "skipped";
  }

  const to = toE164(phone);
  if (!to) {
    logWarning("member.credentials.whatsapp.skipped", { reason: "invalid_phone" });
    return "skipped";
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${env.WHATSAPP_API_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: env.WHATSAPP_TEMPLATE_NAME,
            language: { code: env.WHATSAPP_TEMPLATE_LANG },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: userId },
                  { type: "text", text: tempPassword },
                ],
              },
            ],
          },
        }),
      }
    );

    if (!response.ok) {
      logWarning("member.credentials.whatsapp.failed", { status: response.status });
      return "failed";
    }
    return "sent";
  } catch (err) {
    logError("member.credentials.whatsapp.failed", err);
    return "failed";
  }
}
