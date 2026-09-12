import type { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";

/**
 * Global error handler middleware.
 * Catches all unhandled errors, logs them to file, and returns a consistent JSON response.
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const statusCode = (err as any).statusCode || 500;

  logger.error(err.message, {
    error: err,
    method: req.method,
    url: req.originalUrl,
    statusCode,
    meta: {
      ip: req.ip,
      userAgent: req.get("user-agent"),
      body: req.method !== "GET" ? req.body : undefined,
    },
  });

  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message;

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
}

