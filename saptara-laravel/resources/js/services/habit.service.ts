import { apiFetch } from "../lib/api-client";
import type { Habit, TodayMission, ToggleHabitResponse } from "../types";

export const habitService = {
  async getAll(): Promise<Habit[]> {
    return apiFetch<Habit[]>("/api/habits");
  },

  async getTodayMissions(studentId: number): Promise<TodayMission[]> {
    return apiFetch<TodayMission[]>(`/api/habits/missions/${studentId}`);
  },

  async toggleHabit(habitId: number): Promise<ToggleHabitResponse> {
    return apiFetch<ToggleHabitResponse>("/api/habits/toggle", {
      method: "POST",
      body: JSON.stringify({ habitId }),
    });
  },
};
