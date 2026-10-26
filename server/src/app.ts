import express, { Application } from "express";
import { existsSync } from "node:fs";
import path from "node:path";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { env } from "./utils/env";
import { accessLogStream } from "./utils/logger";
import { csrfProtection } from "./middleware/csrf";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

import authRoutes from "./routes/auth.routes";
import memberRoutes from "./routes/member.routes";
import saleRoutes from "./routes/sale.routes";
import rankRoutes from "./routes/rank.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import contactRoutes from "./routes/contact.routes";
import commissionRoutes from "./routes/commission.routes";

export function createApp(): Application {
  const app = express();

  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
  app.use(morgan("combined", { stream: accessLogStream }));
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (origin === env.CLIENT_ORIGIN) {
          callback(null, true);
          return;
        }

        if (!env.isProduction && origin) {
          try {
            const url = new URL(origin);
            const isLocalDevelopmentOrigin =
              url.protocol === "http:" &&
              ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
            callback(null, isLocalDevelopmentOrigin);
            return;
          } catch {
            callback(null, false);
            return;
          }
        }

        callback(null, false);
      },
      credentials: true,
    })
  );
  app.use(cookieParser());
  app.use(express.json());
  app.use(csrfProtection);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/members", memberRoutes);
  app.use("/api/sales", saleRoutes);
  app.use("/api/ranks", rankRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/contact", contactRoutes);
  app.use("/api/commissions", commissionRoutes);

  const clientBuildPath = path.resolve(__dirname, "../../client/dist");
  if (existsSync(clientBuildPath)) {
    app.use(express.static(clientBuildPath));
    app.get("*", (req, res, next) => {
      if (req.path === "/api" || req.path.startsWith("/api/")) {
        next();
        return;
      }
      res.sendFile(path.join(clientBuildPath, "index.html"), (error) => {
        if (error) next(error);
      });
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
