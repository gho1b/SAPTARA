import { db } from "../db/index.js";
import {
  studentBadge,
  studentAccessory,
  student,
  habit,
  logbookEntry,
} from "../db/schema.js";
import { eq, and, sql } from "drizzle-orm";
import { SHIP_ACCESSORIES } from "../types/index.js";
import { getWIBDateTime } from "../utils/timezone.js";

export const rewardService = {
  /**
   * Get all badges for a student.
   */
  async getBadges(studentId: number) {
    const badges = await db
      .select({
        id: studentBadge.id,
        habitId: studentBadge.habitId,
        awardedAt: studentBadge.awardedAt,
        habitName: habit.name,
        badge: habit.badge,
        badgeIcon: habit.badgeIcon,
      })
      .from(studentBadge)
      .innerJoin(habit, eq(studentBadge.habitId, habit.id))
      .where(eq(studentBadge.studentId, studentId));

    return badges;
  },

  /**
   * Award a badge to a student (teacher action).
   */
  async awardBadge(studentId: number, habitId: number, teacherId: number) {
    // Check if already has this badge
    const [existing] = await db
      .select()
      .from(studentBadge)
      .where(
        and(
          eq(studentBadge.studentId, studentId),
          eq(studentBadge.habitId, habitId)
        )
      )
      .limit(1);

    if (existing) {
      throw Object.assign(new Error("Murid sudah memiliki lencana ini"), {
        statusCode: 409,
      });
    }

    const [badge] = await db
      .insert(studentBadge)
      .values({
        studentId,
        habitId,
        awardedByTeacherId: teacherId,
      })
      .returning();

    // Get badge name
    const [h] = await db
      .select({ badge: habit.badge })
      .from(habit)
      .where(eq(habit.id, habitId))
      .limit(1);

    return { ...badge, badgeName: h?.badge };
  },

  /**
   * Get all available accessories (static config).
   */
  getAllAccessories() {
    return SHIP_ACCESSORIES;
  },

  /**
   * Get accessories owned by a student.
   */
  async getStudentAccessories(studentId: number) {
    const owned = await db
      .select({ accessoryId: studentAccessory.accessoryId })
      .from(studentAccessory)
      .where(eq(studentAccessory.studentId, studentId));

    const ownedIds = owned.map((a) => a.accessoryId);

    return SHIP_ACCESSORIES.map((acc) => ({
      ...acc,
      owned: ownedIds.includes(acc.id),
    }));
  },

  /**
   * Purchase an accessory with coins.
   */
  async purchaseAccessory(studentId: number, accessoryId: string) {
    const accessory = SHIP_ACCESSORIES.find((a) => a.id === accessoryId);
    if (!accessory) {
      throw Object.assign(new Error("Aksesori tidak ditemukan"), {
        statusCode: 404,
      });
    }

    // Check if already owned
    const [existing] = await db
      .select()
      .from(studentAccessory)
      .where(
        and(
          eq(studentAccessory.studentId, studentId),
          eq(studentAccessory.accessoryId, accessoryId)
        )
      )
      .limit(1);

    if (existing) {
      throw Object.assign(new Error("Aksesori sudah dimiliki"), {
        statusCode: 409,
      });
    }

    // Check coins
    const [s] = await db
      .select({ coins: student.coins })
      .from(student)
      .where(eq(student.id, studentId))
      .limit(1);

    if (!s || s.coins < accessory.price) {
      throw Object.assign(new Error("Koin tidak cukup!"), {
        statusCode: 400,
      });
    }

    // Deduct coins and add accessory
    await db
      .update(student)
      .set({ coins: sql`${student.coins} - ${accessory.price}` })
      .where(eq(student.id, studentId));

    const [purchased] = await db
      .insert(studentAccessory)
      .values({ studentId, accessoryId })
      .returning();

    return { ...purchased, accessory };
  },

  /**
   * Send a "message in a bottle" (sticker + comment) to a student (teacher action).
   * Creates a special logbook entry.
   */
  async sendBottleMessage(
    studentId: number,
    teacherId: number,
    sticker: string,
    comment: string
  ) {
    const { date: wibDate, time: wibTime } = getWIBDateTime();

    const [entry] = await db
      .insert(logbookEntry)
      .values({
        studentId,
        habitId: 1, // Default to first habit
        date: wibDate,
        time: wibTime,
        caption: "Pesan dari Guru",
        status: "verified",
        reviewedByTeacherId: teacherId,
        teacherComment: comment,
        teacherSticker: sticker,
        xpEarned: 10,
      })
      .returning();

    // Award XP
    await db
      .update(student)
      .set({ xp: sql`${student.xp} + 10` })
      .where(eq(student.id, studentId));

    return entry;
  },
};
