import { Router } from "express";
import { classService } from "../services/class.service.js";
import { requireTeacher } from "../middleware/auth.middleware.js";
import { requireParent } from "../middleware/parent-auth.middleware.js";
import type { AuthenticatedRequest } from "../types/index.js";

const router = Router();

// POST /api/classes — Create a new class
router.post("/", requireTeacher, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { schoolName, classCode, shipName } = req.body;

    if (!schoolName || !classCode) {
      res.status(400).json({ error: "schoolName and classCode are required" });
      return;
    }

    const newClass = await classService.create(
      req.teacher!.teacherId,
      schoolName,
      classCode,
      shipName
    );

    res.status(201).json(newClass);
  } catch (error) {
    next(error);
  }
});

// GET /api/classes — Get teacher's classes
router.get("/", requireTeacher, async (req: AuthenticatedRequest, res, next) => {
  try {
    const classes = await classService.getByTeacher(req.teacher!.teacherId);
    res.json(classes);
  } catch (error) {
    next(error);
  }
});

// ⚠️ Parent routes MUST come BEFORE /:id to prevent Express from treating
// the literal "parent" string as the :id parameter.

// GET /api/classes/parent/info — Parent: get own class info from JWT classId
router.get("/parent/info", requireParent, async (req: AuthenticatedRequest, res, next) => {
  try {
    const classId = req.parent!.classId;
    const cls = await classService.getByIdPublic(classId);
    res.json(cls);
  } catch (error) {
    next(error);
  }
});

// GET /api/classes/parent/students — Parent: get students in own class
router.get("/parent/students", requireParent, async (req: AuthenticatedRequest, res, next) => {
  try {
    const classId = req.parent!.classId;
    const students = await classService.getStudents(classId);
    res.json(students);
  } catch (error) {
    next(error);
  }
});

// GET /api/classes/:id — Get class details + stats  (must be AFTER /parent/*)
router.get("/:id", requireTeacher, async (req: AuthenticatedRequest, res, next) => {
  try {
    const classId = parseInt(req.params.id as string);
    const cls = await classService.getById(classId);
    res.json(cls);
  } catch (error) {
    next(error);
  }
});

// GET /api/classes/:id/students — Get all students in class
router.get("/:id/students", requireTeacher, async (req: AuthenticatedRequest, res, next) => {
  try {
    const classId = parseInt(req.params.id as string);
    const students = await classService.getStudents(classId);
    res.json(students);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/classes/:id — Delete a class
router.delete("/:id", requireTeacher, async (req: AuthenticatedRequest, res, next) => {
  try {
    const classId = parseInt(req.params.id as string);
    const result = await classService.delete(classId, req.teacher!.teacherId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
