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
