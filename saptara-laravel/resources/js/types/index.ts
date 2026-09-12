// ════════════════════════════════════════════
// SAPTARA — Shared TypeScript Types
// ════════════════════════════════════════════

export interface Teacher {
  id: number;
  userId: string;
  displayName: string;
  createdAt: string;
}

export interface StudentLoginResponse {
  token: string;
  student: {
    studentId: number;
    classId: number;
    name: string;
    avatar: string;
  };
}

export interface ParentLoginResponse {
  token: string;
  parent: {
    studentId: number;
    classId: number;
    studentName: string;
    studentAvatar: string;
  };
  class?: {
    id: number;
    classCode: string;
    schoolName: string;
    shipName: string;
  };
}

export interface ParentInfo {
  studentId: number;
  classId: number;
  studentName: string;
  studentAvatar: string;
}

export interface Class {
  id: number;
  teacherId?: number;
  schoolName?: string;
  classCode?: string;
  shipName?: string;
  createdAt?: string;
  teacher_id?: number;
  school_name?: string;
  class_code?: string;
  ship_name?: string;
  created_at?: string;
  students_count?: number;
}

export interface CreateClassPayload {
  schoolName: string;
  classCode: string;
  shipName?: string;
}

export interface Student {
  id: number;
  classId: number;
  name: string;
  avatar: string;
  xp: number;
  coins: number;
  streak: number;
  lastActiveDate: string | null;
  createdAt: string;
}

export interface CreateStudentPayload {
  classId: number;
  name: string;
  avatar?: string;
}

export interface ShipLevel {
  level: number;
  name: string;
  emoji: string;
  minXP: number;
  maxXP: number;
  description: string;
  ship: string;
}

export interface Habit {
  id: number;
  name: string;
  icon: string;
  island: string;
  badge: string;
  badgeIcon: string;
  color: string;
  description: string;
  positionX: number;
  positionY: number;
}

export interface TodayMission {
  habit: Habit;
  completed: boolean;
  completedAt?: string;
}

export interface StudentDashboard {
  student: Student;
  shipLevel: ShipLevel;
  todayMissions: TodayMission[];
  completedToday: number;
  totalHabits: number;
  streak: number;
}

export interface WeeklyData {
  day: string;
  date: string;
  completed: number;
}

export interface CompassData {
  habitId: number;
  name: string;
  icon: string;
  color: string;
  score: number;
  completions: number;
}

export interface LeaderboardEntry {
  rank: number;
  studentId: number;
  name: string;
  avatar: string;
  xp: number;
  streak: number;
  shipLevel: ShipLevel;
}

export interface ToggleHabitPayload {
  habitId: number;
}

export interface ToggleHabitResponse {
  completed: boolean;
  xpChange: number;
  newXP: number;
  newCoins: number;
}

export interface LogbookEntry {
  id: number;
  studentId: number;
  habitId: number;
  date: string;
  time: string;
  photoUrl: string | null;
  caption: string;
  status: "pending" | "verified" | "rejected" | "needs_revision";
  reviewedByTeacherId: number | null;
  teacherComment: string | null;
  teacherSticker: string | null;
  parentComment: string | null;
  xpEarned: number;
  createdAt: string;
  updatedAt: string;
  studentName?: string;
  studentAvatar?: string;
  habitName?: string;
  habitIcon?: string;
}

export interface SubmitLogbookPayload {
  habitId: number;
  caption: string;
  photo?: File;
}

export interface StudentBadge {
  id: number;
  studentId: number;
  habitId: number;
  awardedByTeacherId: number | null;
  awardedAt: string;
  habitName?: string;
  habitIcon?: string;
  badgeName?: string;
  badgeIcon?: string;
}

export interface StudentAccessory {
  id: string;
  name: string;
  icon: string;
  price: number;
  type: string;
  owned: boolean;
}
