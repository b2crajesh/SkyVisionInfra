import express, { Application } from "express";
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
      origin: env.CLIENT_ORIGIN,
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

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
