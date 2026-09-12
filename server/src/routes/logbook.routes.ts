import { Router } from "express";
import multer from "multer";
import path from "path";
import { logbookService } from "../services/logbook.service.js";
import { requireStudent } from "../middleware/student-auth.middleware.js";
import { requireTeacher } from "../middleware/auth.middleware.js";
import { requireTeacherOrParent, requireParent } from "../middleware/parent-auth.middleware.js";
import type { AuthenticatedRequest } from "../types/index.js";

const router = Router();

// ── Multer config for photo uploads ──
const uploadDir = process.env.UPLOAD_DIR || "./uploads";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `logbook-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// POST /api/logbook — Submit new logbook entry (with photo)
router.post(
  "/",
  requireStudent,
  upload.single("photo"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { habitId, caption } = req.body;

      if (!habitId || !caption) {
        res.status(400).json({ error: "habitId and caption are required" });
        return;
      }

      const photoUrl = req.file
        ? `/uploads/${req.file.filename}`
        : null;

      const entry = await logbookService.create(
        req.student!.studentId,
        parseInt(habitId),
        caption,
        photoUrl
      );

      res.status(201).json(entry);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/logbook/student/:studentId — Get student's logbook
router.get("/student/:studentId", async (req, res, next) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const entries = await logbookService.getByStudent(studentId);
    res.json(entries);
  } catch (error) {
    next(error);
  }
});

// GET /api/logbook/class/:classId — Get all entries in class (teacher/parent feed)
router.get("/class/:classId", requireTeacherOrParent, async (req: AuthenticatedRequest, res, next) => {
  try {
    const classId = parseInt(req.params.classId as string);
    const entries = await logbookService.getByClass(classId);
    res.json(entries);
  } catch (error) {
    next(error);
  }
});

// GET /api/logbook/pending/:classId — Get pending entries only (teacher/parent)
router.get("/pending/:classId", requireTeacherOrParent, async (req: AuthenticatedRequest, res, next) => {
  try {
    const classId = parseInt(req.params.classId as string);
    const entries = await logbookService.getPending(classId);
    res.json(entries);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/logbook/:id/verify — Approve entry
router.patch("/:id/verify", requireTeacher, async (req: AuthenticatedRequest, res, next) => {
  try {
    const entryId = parseInt(req.params.id as string);
    const { sticker, comment } = req.body;

    const entry = await logbookService.verify(
      entryId,
      req.teacher!.teacherId,
      sticker,
      comment
    );
    res.json(entry);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/logbook/:id/reject — Reject entry
router.patch("/:id/reject", requireTeacher, async (req: AuthenticatedRequest, res, next) => {
  try {
    const entryId = parseInt(req.params.id as string);
    const { comment } = req.body;

    const entry = await logbookService.reject(
      entryId,
      req.teacher!.teacherId,
      comment
    );
    res.json(entry);
  } catch (error) {
    next(error);
  }
});

// POST /api/logbook/batch-verify — Batch approve entries
router.post("/batch-verify", requireTeacher, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { entryIds, sticker, comment } = req.body;

    if (!entryIds || !Array.isArray(entryIds)) {
      res.status(400).json({ error: "entryIds array is required" });
      return;
    }

    const results = await logbookService.batchVerify(
      entryIds,
      req.teacher!.teacherId,
      sticker,
      comment
    );
    res.json({ verified: results.length, entries: results });
  } catch (error) {
    next(error);
  }
});

// POST /api/logbook/:id/parent-comment — Parent adds comment on a logbook entry
router.post("/:id/parent-comment", requireParent, async (req: AuthenticatedRequest, res, next) => {
  try {
    const entryId = parseInt(req.params.id as string);
    const { comment } = req.body;

    if (!comment || typeof comment !== "string" || comment.trim().length === 0) {
      res.status(400).json({ error: "Komentar tidak boleh kosong" });
      return;
    }

    const entry = await logbookService.addParentComment(entryId, comment.trim());
    res.json(entry);
  } catch (error) {
    next(error);
  }
});

export default router;
