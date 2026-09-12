import {
  sqliteTable,
  text,
  integer,
  unique,
  index,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ════════════════════════════════════════════
// 1–3. Better Auth Tables (managed by Better Auth)
// ════════════════════════════════════════════

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ════════════════════════════════════════════
// 4. Teacher
// ════════════════════════════════════════════

export const teacher = sqliteTable("teacher", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// ════════════════════════════════════════════
// 5. Class
// ════════════════════════════════════════════

export const classTable = sqliteTable(
  "class",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    teacherId: integer("teacher_id")
      .notNull()
      .references(() => teacher.id, { onDelete: "cascade" }),
    schoolName: text("school_name").notNull(),
    classCode: text("class_code").notNull(),
    shipName: text("ship_name").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [
    unique("class_code_school_unique").on(table.classCode, table.schoolName),
    index("class_teacher_idx").on(table.teacherId),
  ]
);

// ════════════════════════════════════════════
// 6. Student
// ════════════════════════════════════════════

export const student = sqliteTable(
  "student",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    classId: integer("class_id")
      .notNull()
      .references(() => classTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    avatar: text("avatar").notNull().default("🧒"),
    xp: integer("xp").notNull().default(0),
    coins: integer("coins").notNull().default(0),
    streak: integer("streak").notNull().default(0),
    lastActiveDate: text("last_active_date"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [
    index("student_class_idx").on(table.classId),
    unique("student_name_class_unique").on(table.name, table.classId),
  ]
);

// ════════════════════════════════════════════
// 7. Habit (Seed data — 7 fixed rows)
// ════════════════════════════════════════════

export const habit = sqliteTable("habit", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  island: text("island").notNull(),
  badge: text("badge").notNull(),
  badgeIcon: text("badge_icon").notNull(),
  color: text("color").notNull(),
  description: text("description").notNull(),
  positionX: integer("position_x").notNull(),
  positionY: integer("position_y").notNull(),
});

// ════════════════════════════════════════════
// 8. Habit Completion (daily)
// ════════════════════════════════════════════

export const habitCompletion = sqliteTable(
  "habit_completion",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    studentId: integer("student_id")
      .notNull()
      .references(() => student.id, { onDelete: "cascade" }),
    habitId: integer("habit_id")
      .notNull()
      .references(() => habit.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    completedAt: integer("completed_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [
    unique("habit_completion_unique").on(
      table.studentId,
      table.habitId,
      table.date
    ),
    index("habit_completion_student_date_idx").on(table.studentId, table.date),
  ]
);

// ════════════════════════════════════════════
// 9. Logbook Entry (photo verification)
// ════════════════════════════════════════════

export const logbookEntry = sqliteTable(
  "logbook_entry",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    studentId: integer("student_id")
      .notNull()
      .references(() => student.id, { onDelete: "cascade" }),
    habitId: integer("habit_id")
      .notNull()
      .references(() => habit.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    time: text("time").notNull(),
    photoUrl: text("photo_url"),
    caption: text("caption").notNull(),
    status: text("status").notNull().default("pending"),
    reviewedByTeacherId: integer("reviewed_by_teacher_id").references(
      () => teacher.id
    ),
    teacherComment: text("teacher_comment"),
    teacherSticker: text("teacher_sticker"),
    parentComment: text("parent_comment"),
    xpEarned: integer("xp_earned").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [
    index("logbook_student_idx").on(table.studentId),
    index("logbook_status_idx").on(table.status),
    index("logbook_date_idx").on(table.date),
  ]
);

// ════════════════════════════════════════════
// 10. Student Badge
// ════════════════════════════════════════════

export const studentBadge = sqliteTable(
  "student_badge",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    studentId: integer("student_id")
      .notNull()
      .references(() => student.id, { onDelete: "cascade" }),
    habitId: integer("habit_id")
      .notNull()
      .references(() => habit.id, { onDelete: "cascade" }),
    awardedByTeacherId: integer("awarded_by_teacher_id").references(
      () => teacher.id
    ),
    awardedAt: integer("awarded_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [
    unique("student_badge_unique").on(table.studentId, table.habitId),
  ]
);

// ════════════════════════════════════════════
// 11. Student Accessory
// ════════════════════════════════════════════

export const studentAccessory = sqliteTable(
  "student_accessory",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    studentId: integer("student_id")
      .notNull()
      .references(() => student.id, { onDelete: "cascade" }),
    accessoryId: text("accessory_id").notNull(),
    purchasedAt: integer("purchased_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [
    unique("student_accessory_unique").on(table.studentId, table.accessoryId),
  ]
);

// ════════════════════════════════════════════
// 12. Weekly Snapshot (cached performance data)
// ════════════════════════════════════════════

export const weeklySnapshot = sqliteTable(
  "weekly_snapshot",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    studentId: integer("student_id")
      .notNull()
      .references(() => student.id, { onDelete: "cascade" }),
    weekStartDate: text("week_start_date").notNull(),
    dayOfWeek: integer("day_of_week").notNull(), // 0=Mon, 6=Sun
    completedCount: integer("completed_count").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [
    index("weekly_student_week_idx").on(table.studentId, table.weekStartDate),
  ]
);

// ════════════════════════════════════════════
// Relations (Drizzle relational queries)
// ════════════════════════════════════════════

export const userRelations = relations(user, ({ one }) => ({
  teacher: one(teacher, {
    fields: [user.id],
    references: [teacher.userId],
  }),
}));

export const teacherRelations = relations(teacher, ({ one, many }) => ({
  user: one(user, {
    fields: [teacher.userId],
    references: [user.id],
  }),
  classes: many(classTable),
}));

export const classRelations = relations(classTable, ({ one, many }) => ({
  teacher: one(teacher, {
    fields: [classTable.teacherId],
    references: [teacher.id],
  }),
  students: many(student),
}));

export const studentRelations = relations(student, ({ one, many }) => ({
  class: one(classTable, {
    fields: [student.classId],
    references: [classTable.id],
  }),
  habitCompletions: many(habitCompletion),
  logbookEntries: many(logbookEntry),
  badges: many(studentBadge),
  accessories: many(studentAccessory),
  weeklySnapshots: many(weeklySnapshot),
}));

export const habitRelations = relations(habit, ({ many }) => ({
  completions: many(habitCompletion),
  logbookEntries: many(logbookEntry),
  badges: many(studentBadge),
}));

export const habitCompletionRelations = relations(
  habitCompletion,
  ({ one }) => ({
    student: one(student, {
      fields: [habitCompletion.studentId],
      references: [student.id],
    }),
    habit: one(habit, {
      fields: [habitCompletion.habitId],
      references: [habit.id],
    }),
  })
);

export const logbookEntryRelations = relations(logbookEntry, ({ one }) => ({
  student: one(student, {
    fields: [logbookEntry.studentId],
    references: [student.id],
  }),
  habit: one(habit, {
    fields: [logbookEntry.habitId],
    references: [habit.id],
  }),
  reviewedBy: one(teacher, {
    fields: [logbookEntry.reviewedByTeacherId],
    references: [teacher.id],
  }),
}));

export const studentBadgeRelations = relations(studentBadge, ({ one }) => ({
  student: one(student, {
    fields: [studentBadge.studentId],
    references: [student.id],
  }),
  habit: one(habit, {
    fields: [studentBadge.habitId],
    references: [habit.id],
  }),
  awardedBy: one(teacher, {
    fields: [studentBadge.awardedByTeacherId],
    references: [teacher.id],
  }),
}));

export const studentAccessoryRelations = relations(
  studentAccessory,
  ({ one }) => ({
    student: one(student, {
      fields: [studentAccessory.studentId],
      references: [student.id],
    }),
  })
);

export const weeklySnapshotRelations = relations(
  weeklySnapshot,
  ({ one }) => ({
    student: one(student, {
      fields: [weeklySnapshot.studentId],
      references: [student.id],
    }),
  })
);
