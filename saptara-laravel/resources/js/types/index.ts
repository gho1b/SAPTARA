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

export interface ParentChild {
  id: number;
  name: string;
  avatar: string;
  classId: number;
  classCode: string;
  className: string;
  schoolName: string;
  shipName: string;
  level: number;
  xp: number;
  coins: number;
}

export interface ParentLoginResponse {
  token: string;
  role?: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  parent: {
    studentId: number;
    classId: number;
    studentName: string;
    studentAvatar: string;
  };
  children?: ParentChild[];
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
  children?: ParentChild[];
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
  is_custom?: boolean;
  isCustom?: boolean;
  class_id?: number | null;
  created_by_teacher_id?: number | null;
  completions_count?: number;
  logbook_entries_count?: number;
}

export interface TodayMission {
  habit: Habit;
  completed: boolean;
  completedAt?: string;
}

export interface DailyQuest {
  key: string;
  title: string;
  description: string;
  icon: string;
  target: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
  rewardXp: number;
  rewardCoins: number;
}

export interface DailyQuestsResponse {
  date: string;
  quests: DailyQuest[];
}

export interface ClassMission {
  id: number;
  class_id: number;
  title: string;
  description: string;
  type: "total_habits" | "photo_logbooks";
  target_count: number;
  current_progress: number;
  percentage: number;
  completed: boolean;
  claimed: boolean;
  reward_xp_each: number;
  reward_coins_each: number;
  start_date: string;
  end_date: string;
  days_left: number;
}

export interface CreateClassMissionPayload {
  title: string;
  description?: string;
  type: "total_habits" | "photo_logbooks";
  target_count: number;
  reward_xp_each?: number;
  reward_coins_each?: number;
  start_date?: string;
  end_date: string;
}

export interface MilestoneReward {
  days: number;
  bonus_xp: number;
  bonus_coins: number;
  title: string;
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
  action?: "completed" | "uncompleted";
  habit_id?: number;
  completed?: boolean;
  streak?: number;
  milestoneReward?: MilestoneReward | null;
  xpChange?: number;
  newXP?: number;
  newCoins?: number;
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
