import { Router } from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "../auth.js";
import { authService } from "../services/auth.service.js";
import { requireTeacher } from "../middleware/auth.middleware.js";
import type { AuthenticatedRequest } from "../types/index.js";

const router = Router();

// ═══════════════════════════════════════════
// IMPORTANT: Custom auth routes MUST come BEFORE
// the Better Auth catch-all, otherwise they get swallowed.
// ═══════════════════════════════════════════

// ── Teacher: post-registration hook to create teacher profile ──
router.post("/api/auth/teacher/profile", requireTeacher, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { displayName } = req.body;
    if (!displayName) {
      res.status(400).json({ error: "displayName is required" });
      return;
    }

    // Check if already exists
    const existing = await authService.getTeacherByUserId(req.teacher!.userId);
    if (existing) {
      res.json(existing);
      return;
    }

    const teacher = await authService.createTeacherProfile(
      req.teacher!.userId,
      displayName
    );
    res.status(201).json(teacher);
  } catch (error) {
    next(error);
  }
});

// ── Student login (name + classCode → JWT) ──
router.post("/api/auth/student/login", async (req, res, next) => {
  try {
    const { name, classCode } = req.body;

    if (!name || !classCode) {
      res.status(400).json({ error: "name and classCode are required" });
      return;
    }

    const result = await authService.studentLogin(name, classCode);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ── Parent login (nama anak + classCode → JWT with role "parent") ──
router.post("/api/auth/parent/login", async (req, res, next) => {
  try {
    const { name, classCode } = req.body;

    if (!name || !classCode) {
      res.status(400).json({ error: "name and classCode are required" });
      return;
    }

    const result = await authService.parentLogin(name, classCode);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ── Better Auth catch-all (handles /api/auth/**) ──
// This handles: sign-up, sign-in, sign-out, get-session, etc.
// MUST be LAST so custom routes above get matched first.
router.all("/api/auth/*splat", toNodeHandler(auth));

export default router;
