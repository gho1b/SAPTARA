import { db } from "../db/index.js";
import { classTable, student, teacher } from "../db/schema.js";
import { eq, and } from "drizzle-orm";

export const classService = {
  /**
   * Create a new class (by teacher).
   */
  async create(
    teacherId: number,
    schoolName: string,
    classCode: string,
    shipName?: string
  ) {
    const code = classCode.toUpperCase();
    const finalShipName =
      shipName || `Kapal ${schoolName.split(" ").slice(-1)[0]} ${code}`;

    // Check for duplicate
    const [existing] = await db
      .select()
      .from(classTable)
      .where(
        and(
          eq(classTable.classCode, code),
          eq(classTable.schoolName, schoolName)
        )
      )
      .limit(1);

    if (existing) {
      throw Object.assign(
        new Error(`Kelas ${code} di ${schoolName} sudah terdaftar!`),
        { statusCode: 409 }
      );
    }

    const [newClass] = await db
      .insert(classTable)
      .values({
        teacherId,
        schoolName,
        classCode: code,
        shipName: finalShipName,
      })
      .returning();

    return newClass;
  },

  /**
   * Get all classes for a teacher.
   */
  async getByTeacher(teacherId: number) {
    return db
      .select()
      .from(classTable)
      .where(eq(classTable.teacherId, teacherId));
  },

  /**
   * Get class by ID with student count.
   */
  async getById(classId: number) {
    const [cls] = await db
      .select()
      .from(classTable)
      .where(eq(classTable.id, classId))
      .limit(1);

    if (!cls) {
      throw Object.assign(new Error("Kelas tidak ditemukan"), {
        statusCode: 404,
      });
    }

    const students = await db
      .select()
      .from(student)
      .where(eq(student.classId, classId));

    return {
      ...cls,
      studentCount: students.length,
      students,
    };
  },

  /**
   * Get all students in a class.
   */
  async getStudents(classId: number) {
    return db
      .select()
      .from(student)
      .where(eq(student.classId, classId));
  },

  /**
   * Delete a class (teacher auth required, cascades students).
   */
  async delete(classId: number, teacherId: number) {
    const [cls] = await db
      .select()
      .from(classTable)
      .where(
        and(eq(classTable.id, classId), eq(classTable.teacherId, teacherId))
      )
      .limit(1);

    if (!cls) {
      throw Object.assign(
        new Error("Kelas tidak ditemukan atau bukan milik kamu"),
        { statusCode: 404 }
      );
    }

    await db.delete(classTable).where(eq(classTable.id, classId));
    return { success: true };
  },

  /**
   * Get a class by its ID (public — used by parent after JWT decode).
   */
  async getByIdPublic(classId: number) {
    const [cls] = await db
      .select()
      .from(classTable)
      .where(eq(classTable.id, classId))
      .limit(1);

    if (!cls) {
      throw Object.assign(new Error("Kelas tidak ditemukan"), {
        statusCode: 404,
      });
    }

    return cls;
  },
};
