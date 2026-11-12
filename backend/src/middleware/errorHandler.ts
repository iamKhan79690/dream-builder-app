import type { ErrorRequestHandler } from "express";

// Express recognises an error handler by its 4 arguments (err, req, res, next).
// Express 5 also sends errors thrown inside async handlers here automatically.
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error(`[error] ${req.method} ${req.originalUrl}`, err);

  // If a response already started streaming, let Express close the connection.
  if (res.headersSent) {
    next(err);
    return;
  }

  // Errors from Express's own parsers (e.g. malformed JSON -> 400, body too big -> 413)
  // carry a 4xx status and `expose: true`. Those are the client's fault, not a server bug.
  if (err?.expose === true && err.status >= 400 && err.status < 500) {
    res.status(err.status).json({ error: "Bad request" });
    return;
  }

  // Never leak error details (stack traces, SQL, etc.) to the client.
  res.status(500).json({ error: "Internal server error" });
};
