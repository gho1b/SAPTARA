import { db } from "../db/index.js";
import {
  student,
  habitCompletion,
  studentBadge,
  studentAccessory,
  habit,
} from "../db/schema.js";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import { getShipLevel } from "../types/index.js";
import { getWIBDate, getWIBDateDaysAgo, getWIBDayIndex } from "../utils/timezone.js";

export const studentService = {
  /**
   * Create a new student in a class (teacher action).
   */
  async create(
    classId: number,
    name: string,
    avatar: string = "🧒"
  ) {
    // Check for duplicate name in same class
    const [existing] = await db
      .select()
      .from(student)
      .where(and(eq(student.name, name), eq(student.classId, classId)))
      .limit(1);

    if (existing) {
      throw Object.assign(
        new Error(`"${name}" sudah terdaftar di kelas ini!`),
        { statusCode: 409 }
      );
    }

    const [newStudent] = await db
      .insert(student)
      .values({ classId, name, avatar })
      .returning();

    return newStudent;
  },

  /**
   * Get student by ID with all computed stats.
   */
  async getById(studentId: number) {
    const [s] = await db
      .select()
      .from(student)
      .where(eq(student.id, studentId))
      .limit(1);

    if (!s) {
      throw Object.assign(new Error("Murid tidak ditemukan"), {
        statusCode: 404,
      });
    }

    // Get badges
    const badges = await db
      .select({ habitId: studentBadge.habitId })
      .from(studentBadge)
      .where(eq(studentBadge.studentId, studentId));

    // Get badge names by joining with habit
    const badgeNames: string[] = [];
    for (const b of badges) {
      const [h] = await db
        .select({ badge: habit.badge })
        .from(habit)
        .where(eq(habit.id, b.habitId))
        .limit(1);
      if (h) badgeNames.push(h.badge);
    }

    // Get accessories
    const accessories = await db
      .select({ accessoryId: studentAccessory.accessoryId })
      .from(studentAccessory)
      .where(eq(studentAccessory.studentId, studentId));

    const shipLevel = getShipLevel(s.xp);

    return {
      ...s,
      nauticalMiles: s.xp,
      level: shipLevel.level,
      shipLevel,
      badges: badgeNames,
      accessories: accessories.map((a) => a.accessoryId),
    };
  },

  /**
   * Get full dashboard data for student map page.
   */
  async getDashboard(studentId: number) {
    const studentData = await this.getById(studentId);

    // Get today's completions
    const today = getWIBDate();
    const todayCompletions = await db
      .select({ habitId: habitCompletion.habitId })
      .from(habitCompletion)
      .where(
        and(
          eq(habitCompletion.studentId, studentId),
          eq(habitCompletion.date, today)
        )
      );

    const completedToday = todayCompletions.length;

    return {
      student: studentData,
      shipLevel: studentData.shipLevel,
      completedToday,
      totalHabits: 7,
      streak: studentData.streak ?? 0,
    };
  },

  /**
   * Get weekly completion trend (last 7 days).
   */
  async getWeeklyData(studentId: number) {
    const days = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
    const result = [];

    for (let i = 6; i >= 0; i--) {
      const dateStr = getWIBDateDaysAgo(i);
      const dayIndex = getWIBDayIndex(i);

      const completions = await db
        .select({ count: sql<number>`count(*)` })
        .from(habitCompletion)
        .where(
          and(
            eq(habitCompletion.studentId, studentId),
            eq(habitCompletion.date, dateStr)
          )
        );

      result.push({
        day: days[dayIndex],
        date: dateStr,
        completed: Number(completions[0]?.count || 0),
      });
    }

    return result;
  },

  /**
   * Get compass/radar chart data (habit scores as % over last 30 days).
   */
  async getCompassData(studentId: number) {
    const sinceDate = getWIBDateDaysAgo(30);

    const habits: Record<number, number> = {};

    // Get completions per habit in last 30 days
    const completions = await db
      .select({
        habitId: habitCompletion.habitId,
        count: sql<number>`count(*)`,
      })
      .from(habitCompletion)
      .where(
        and(
          eq(habitCompletion.studentId, studentId),
          gte(habitCompletion.date, sinceDate)
        )
      )
      .groupBy(habitCompletion.habitId);

    // Calculate percentage (out of 30 days)
    for (let i = 1; i <= 7; i++) {
      const found = completions.find((c) => c.habitId === i);
      habits[i] = Math.round(((found?.count || 0) / 30) * 100);
    }

    return habits;
  },

  /**
   * Delete a student (teacher action, cascades related data).
   */
  async delete(studentId: number) {
    const [s] = await db
      .select()
      .from(student)
      .where(eq(student.id, studentId))
      .limit(1);

    if (!s) {
      throw Object.assign(new Error("Murid tidak ditemukan"), {
        statusCode: 404,
      });
    }

    await db.delete(student).where(eq(student.id, studentId));
    return { success: true, name: s.name };
  },

  /**
   * Get class leaderboard sorted by XP (nauticalMiles).
   */
  async getLeaderboard(classId: number) {
    const students = await db
      .select()
      .from(student)
      .where(eq(student.classId, classId))
      .orderBy(desc(student.xp));

    return students.map((s) => ({
      ...s,
      nauticalMiles: s.xp,
      shipLevel: getShipLevel(s.xp),
    }));
  },
};
