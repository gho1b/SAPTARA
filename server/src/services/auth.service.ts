import jwt from "jsonwebtoken";
import { db } from "../db/index.js";
import { student, classTable, teacher } from "../db/schema.js";
import { eq, and, like, sql } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "saptara-student-jwt-secret";

export const authService = {
  /**
   * Student login with name + classCode.
   * Returns a JWT token and student data.
   */
  async studentLogin(name: string, classCode: string) {
    // Find class by classCode
    const [cls] = await db
      .select()
      .from(classTable)
      .where(eq(classTable.classCode, classCode.toUpperCase()))
      .limit(1);

    if (!cls) {
      throw Object.assign(new Error("Kelas tidak ditemukan"), {
        statusCode: 404,
      });
    }

    // Find student by name in that class (case-insensitive)
    const [matchedStudent] = await db
      .select()
      .from(student)
      .where(
        and(
          sql`lower(${student.name}) = lower(${name})`,
          eq(student.classId, cls.id)
        )
      )
      .limit(1);

    if (!matchedStudent) {
      throw Object.assign(
        new Error("Nama tidak ditemukan di kelas ini. Hubungi gurumu!"),
        { statusCode: 404 }
      );
    }

    // Generate JWT
    const payload = {
      studentId: matchedStudent.id,
      classId: cls.id,
      role: "student" as const,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

    return {
      token,
      student: {
        studentId: matchedStudent.id,
        classId: cls.id,
        name: matchedStudent.name,
        avatar: matchedStudent.avatar,
      },
      class: {
        id: cls.id,
        classCode: cls.classCode,
        schoolName: cls.schoolName,
        shipName: cls.shipName,
      },
    };
  },

  /**
   * After Better Auth registration, create a teacher record.
   */
  async createTeacherProfile(userId: string, displayName: string) {
    const [newTeacher] = await db
      .insert(teacher)
      .values({ userId, displayName })
      .returning();

    return newTeacher;
  },

  /**
   * Get teacher profile by Better Auth user ID.
   */
  async getTeacherByUserId(userId: string) {
    const [t] = await db
      .select()
      .from(teacher)
      .where(eq(teacher.userId, userId))
      .limit(1);

    return t || null;
  },

  /**
   * Parent login — same lookup as student but JWT role is "parent".
   * Allows parents to view their child's data without action rights.
   */
  async parentLogin(name: string, classCode: string) {
    // Find class by classCode
    const [cls] = await db
      .select()
      .from(classTable)
      .where(eq(classTable.classCode, classCode.toUpperCase()))
      .limit(1);

    if (!cls) {
      throw Object.assign(new Error("Kelas tidak ditemukan"), {
        statusCode: 404,
      });
    }

    // Find student by name in that class (case-insensitive)
    const [matchedStudent] = await db
      .select()
      .from(student)
      .where(
        and(
          sql`lower(${student.name}) = lower(${name})`,
          eq(student.classId, cls.id)
        )
      )
      .limit(1);

    if (!matchedStudent) {
      throw Object.assign(
        new Error("Nama anak tidak ditemukan di kelas ini. Hubungi gurunya!"),
        { statusCode: 404 }
      );
    }

    const payload = {
      studentId: matchedStudent.id,
      classId: cls.id,
      studentName: matchedStudent.name,
      role: "parent" as const,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

    return {
      token,
      parent: {
        studentId: matchedStudent.id,
        classId: cls.id,
        studentName: matchedStudent.name,
        studentAvatar: matchedStudent.avatar,
      },
      class: {
        id: cls.id,
        classCode: cls.classCode,
        schoolName: cls.schoolName,
        shipName: cls.shipName,
      },
    };
  },
};
