import type { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { AuthenticatedRequest, ParentPayload } from "../types/index.js";
import { requireTeacher } from "./auth.middleware.js";

const JWT_SECRET = process.env.JWT_SECRET || "saptara-student-jwt-secret";

/**
 * Middleware: Require authenticated parent (JWT token with role "parent").
 * Parents use the same name+classCode login as students but get a different
 * role in their token. Attaches `req.parent` with { studentId, classId, studentName, role }.
 */
export function requireParent(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized — parent login required" });
      return;
    }

    const token = authHeader.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as ParentPayload;

    if (payload.role !== "parent") {
      res.status(403).json({ error: "Invalid parent token" });
      return;
    }

    req.parent = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired parent token" });
  }
}

/**
 * Middleware: Allow access for either teacher OR parent.
 * Teachers use Better Auth session (cookie), parents use JWT Bearer token.
 */
export function requireTeacherOrParent(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  // Check for JWT Bearer token (parent)
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const payload = jwt.verify(token, JWT_SECRET) as ParentPayload;
      if (payload.role === "parent") {
        req.parent = payload;
        return next();
      }
    } catch {
      // Fall through to teacher check
    }
  }

  // Fall back to teacher session check (static import, no race condition)
  requireTeacher(req, res, next);
}
