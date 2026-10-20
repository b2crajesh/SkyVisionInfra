import { createApp } from "./app";
import { env } from "./utils/env";
import { prisma } from "./utils/prisma";
import { logError, logInfo } from "./utils/logger";

async function start(): Promise<void> {
  try {
    await prisma.$connect();
    logInfo("database.connected");

    const app = createApp();
    const server = app.listen(env.PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Sky Vision Infra & Developers API listening on port ${env.PORT} [${env.NODE_ENV}]`);
      logInfo("server.listening", { port: env.PORT, environment: env.NODE_ENV });
    });

    server.on("error", (error) => {
      logError("server.listen.failed", error, { port: env.PORT });
      // eslint-disable-next-line no-console
      console.error("API server failed to start:", error.message);
      process.exitCode = 1;
    });
  } catch (error) {
    logError("database.connection.failed", error);
    // eslint-disable-next-line no-console
    console.error("Database connection failed; see server/logs/application.log for details.");
    process.exitCode = 1;
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      logError("database.disconnect.failed", disconnectError);
    }
  }
}

void start();
