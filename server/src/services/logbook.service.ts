import { db } from "../db/index.js";
import { logbookEntry, student, habit, habitCompletion } from "../db/schema.js";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { getWIBDateTime } from "../utils/timezone.js";

export const logbookService = {
  /**
   * Create a new logbook entry (student submits photo proof).
   * Uses WIB (UTC+7) for date and time.
   */
  async create(
    studentId: number,
    habitId: number,
    caption: string,
    photoUrl: string | null
  ) {
    const { date: today, time } = getWIBDateTime();

    const [entry] = await db
      .insert(logbookEntry)
      .values({
        studentId,
        habitId,
        date: today,
        time,
        photoUrl,
        caption,
        status: "pending",
      })
      .returning();

    // Also mark habit as completed for today (if not already)
    const [existing] = await db
      .select()
      .from(habitCompletion)
      .where(
        and(
          eq(habitCompletion.studentId, studentId),
          eq(habitCompletion.habitId, habitId),
          eq(habitCompletion.date, today)
        )
      )
      .limit(1);

    if (!existing) {
      await db.insert(habitCompletion).values({
        studentId,
        habitId,
        date: today,
      });

      await db
        .update(student)
        .set({
          xp: sql`${student.xp} + 10`,
          coins: sql`${student.coins} + 5`,
          lastActiveDate: today,
        })
        .where(eq(student.id, studentId));
    }

    return entry;
  },

  /**
   * Get logbook entries for a specific student.
   * JOINs habit table so the frontend gets habit names/icons directly.
   */
  async getByStudent(studentId: number) {
    return db
      .select({
        id: logbookEntry.id,
        studentId: logbookEntry.studentId,
        habitId: logbookEntry.habitId,
        date: logbookEntry.date,
        time: logbookEntry.time,
        photoUrl: logbookEntry.photoUrl,
        caption: logbookEntry.caption,
        status: logbookEntry.status,
        reviewedByTeacherId: logbookEntry.reviewedByTeacherId,
        teacherComment: logbookEntry.teacherComment,
        teacherSticker: logbookEntry.teacherSticker,
        parentComment: logbookEntry.parentComment,
        xpEarned: logbookEntry.xpEarned,
        createdAt: logbookEntry.createdAt,
        updatedAt: logbookEntry.updatedAt,
        // Joined fields
        habitName: habit.name,
        habitIcon: habit.icon,
      })
      .from(logbookEntry)
      .innerJoin(habit, eq(logbookEntry.habitId, habit.id))
      .where(eq(logbookEntry.studentId, studentId))
      .orderBy(desc(logbookEntry.createdAt));
  },

  /**
   * Get all logbook entries for a class (teacher feed).
   * JOINs student + habit tables so the frontend gets names/icons directly.
   */
  async getByClass(classId: number) {
    const students = await db
      .select({ id: student.id })
      .from(student)
      .where(eq(student.classId, classId));

    const studentIds = students.map((s) => s.id);
    if (studentIds.length === 0) return [];

    const entries = await db
      .select({
        id: logbookEntry.id,
        studentId: logbookEntry.studentId,
        habitId: logbookEntry.habitId,
        date: logbookEntry.date,
        time: logbookEntry.time,
        photoUrl: logbookEntry.photoUrl,
        caption: logbookEntry.caption,
        status: logbookEntry.status,
        reviewedByTeacherId: logbookEntry.reviewedByTeacherId,
        teacherComment: logbookEntry.teacherComment,
        teacherSticker: logbookEntry.teacherSticker,
        parentComment: logbookEntry.parentComment,
        xpEarned: logbookEntry.xpEarned,
        createdAt: logbookEntry.createdAt,
        updatedAt: logbookEntry.updatedAt,
        // Joined fields
        studentName: student.name,
        studentAvatar: student.avatar,
        habitName: habit.name,
        habitIcon: habit.icon,
      })
      .from(logbookEntry)
      .innerJoin(student, eq(logbookEntry.studentId, student.id))
      .innerJoin(habit, eq(logbookEntry.habitId, habit.id))
      .where(inArray(logbookEntry.studentId, studentIds))
      .orderBy(desc(logbookEntry.createdAt));

    return entries;
  },

  /**
   * Get pending entries for a class (teacher feed filtered).
   */
  async getPending(classId: number) {
    const entries = await this.getByClass(classId);
    return entries.filter((e) => e.status === "pending");
  },

  /**
   * Verify (approve) a logbook entry.
   */
  async verify(
    entryId: number,
    teacherId: number,
    sticker: string = "🪙",
    comment: string = "Bagus, Kapten!"
  ) {
    const [entry] = await db
      .select()
      .from(logbookEntry)
      .where(eq(logbookEntry.id, entryId))
      .limit(1);

    if (!entry) {
      throw Object.assign(new Error("Entry tidak ditemukan"), {
        statusCode: 404,
      });
    }

    const xpReward = 15;

    // Update entry
    const [updated] = await db
      .update(logbookEntry)
      .set({
        status: "verified",
        reviewedByTeacherId: teacherId,
        teacherSticker: sticker,
        teacherComment: comment,
        xpEarned: xpReward,
        updatedAt: new Date(),
      })
      .where(eq(logbookEntry.id, entryId))
      .returning();

    // Award XP to student
    await db
      .update(student)
      .set({ xp: sql`${student.xp} + ${xpReward}` })
      .where(eq(student.id, entry.studentId));

    return updated;
  },

  /**
   * Reject a logbook entry (needs revision).
   */
  async reject(
    entryId: number,
    teacherId: number,
    comment: string = "Coba lagi ya, Kapten!"
  ) {
    const [updated] = await db
      .update(logbookEntry)
      .set({
        status: "needs_revision",
        reviewedByTeacherId: teacherId,
        teacherComment: comment,
        updatedAt: new Date(),
      })
      .where(eq(logbookEntry.id, entryId))
      .returning();

    if (!updated) {
      throw Object.assign(new Error("Entry tidak ditemukan"), {
        statusCode: 404,
      });
    }

    return updated;
  },

  /**
   * Batch verify multiple entries at once.
   */
  async batchVerify(
    entryIds: number[],
    teacherId: number,
    sticker: string = "👍",
    comment: string = "Bagus, Kapten! Lanjutkan!"
  ) {
    const results = [];
    for (const id of entryIds) {
      const result = await this.verify(id, teacherId, sticker, comment);
      results.push(result);
    }
    return results;
  },

  /**
   * Add or update a parent comment on a logbook entry.
   * Parents cannot change status — only leave a comment.
   */
  async addParentComment(entryId: number, comment: string) {
    const [entry] = await db
      .select()
      .from(logbookEntry)
      .where(eq(logbookEntry.id, entryId))
      .limit(1);

    if (!entry) {
      throw Object.assign(new Error("Entry tidak ditemukan"), {
        statusCode: 404,
      });
    }

    const [updated] = await db
      .update(logbookEntry)
      .set({
        parentComment: comment,
        updatedAt: new Date(),
      })
      .where(eq(logbookEntry.id, entryId))
      .returning();

    return updated;
  },
};
