import express, { Router } from "express";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./routes/auth.js";
import { childrenRouter } from "./routes/children.js";

export function createApp() {
  const app = express();

  // Parse JSON request bodies into req.body (rejects bodies over 100kb by default).
  app.use(express.json());
  // Parse the Cookie header into req.cookies (we'll read the "sid" session cookie from it).
  app.use(cookieParser());

  // Everything lives under /api/v1. Area routers (auth, children, ...) get mounted here later.
  const api = Router();

  api.get("/health", (_req, res) => {
    res.json({ ok: true });
    return;
  });

  api.use("/auth", authRouter);
  api.use("/children", childrenRouter);

  app.use("/api/v1", api);

  // Must be registered last so it catches errors from everything above.
  app.use(errorHandler);

  return app;
}
