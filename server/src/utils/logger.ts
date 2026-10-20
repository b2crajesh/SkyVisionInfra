import fs from "fs";
import path from "path";
import { createStream } from "rotating-file-stream";

const LOG_DIR = path.join(__dirname, "..", "..", "logs");

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

export const accessLogStream = createStream("access.log", {
  interval: "1d",
  maxFiles: 14,
  path: LOG_DIR,
});

export const applicationLogStream = createStream("application.log", {
  interval: "1d",
  maxFiles: 14,
  path: LOG_DIR,
});

function sanitize(value: string): string {
  return value
    .replace(/(postgres(?:ql)?:\/\/[^:\s]+:)[^@\s]+@/gi, "$1[REDACTED]@")
    .replace(/(password\s*[=:]\s*)[^\s,;]+/gi, "$1[REDACTED]");
}

function getErrorDetails(error: unknown): { name: string; message: string; code?: string } {
  if (!(error instanceof Error)) {
    return { name: "UnknownError", message: sanitize(String(error)) };
  }

  const code =
    "code" in error && typeof error.code === "string" ? sanitize(error.code) : undefined;

  return {
    name: sanitize(error.name),
    message: sanitize(error.message),
    ...(code ? { code } : {}),
  };
}

function writeLog(level: "INFO" | "WARN" | "ERROR", event: string, fields: object = {}): void {
  const line = JSON.stringify({ timestamp: new Date().toISOString(), level, event, ...fields });
  applicationLogStream.write(`${line}\n`);
  // eslint-disable-next-line no-console
  console.log(line);
}

applicationLogStream.on("error", (error) => {
  // eslint-disable-next-line no-console
  console.error("Unable to write application log file:", error);
});

export function logInfo(event: string, fields: object = {}): void {
  writeLog("INFO", event, fields);
}

export function logError(event: string, error: unknown, fields: object = {}): void {
  writeLog("ERROR", event, { ...fields, error: getErrorDetails(error) });
}

export function logWarning(event: string, fields: object = {}): void {
  writeLog("WARN", event, fields);
}
