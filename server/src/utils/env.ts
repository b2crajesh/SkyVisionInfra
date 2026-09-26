import dotenv from "dotenv";

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT ?? 4000),
  DATABASE_URL: required("DATABASE_URL"),
  JWT_SECRET: required("JWT_SECRET"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "15m",
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  COOKIE_SECURE: (process.env.COOKIE_SECURE ?? "false").toLowerCase() === "true",
  isProduction: (process.env.NODE_ENV ?? "development") === "production",
  WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN,
  WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
  WHATSAPP_API_VERSION: process.env.WHATSAPP_API_VERSION ?? "v21.0",
  WHATSAPP_TEMPLATE_NAME: process.env.WHATSAPP_TEMPLATE_NAME ?? "member_credentials",
  WHATSAPP_TEMPLATE_LANG: process.env.WHATSAPP_TEMPLATE_LANG ?? "en_US",
  WHATSAPP_DEFAULT_COUNTRY_CODE: process.env.WHATSAPP_DEFAULT_COUNTRY_CODE ?? "91",
};
