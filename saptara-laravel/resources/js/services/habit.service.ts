import { apiFetch } from "../lib/api-client";
import type { Habit, TodayMission, ToggleHabitResponse } from "../types";

export interface CreateHabitPayload {
  name: string;
  description?: string;
  icon?: string;
  island?: string;
  class_id: number;
}

export const habitService = {
  async getAll(classId?: number): Promise<Habit[]> {
    const url = classId ? `/api/habits?class_id=${classId}` : "/api/habits";
    return apiFetch<Habit[]>(url);
  },

  async getTodayMissions(studentId: number): Promise<TodayMission[]> {
    return apiFetch<TodayMission[]>(`/api/habits/missions/${studentId}`);
  },

  async toggleHabit(habitId: number): Promise<ToggleHabitResponse> {
    return apiFetch<ToggleHabitResponse>("/api/habits/toggle", {
      method: "POST",
      body: JSON.stringify({ habit_id: habitId }),
    });
  },

  async createHabit(payload: CreateHabitPayload): Promise<{ message: string; habit: Habit }> {
    return apiFetch<{ message: string; habit: Habit }>("/api/habits", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateHabit(id: number, payload: Partial<CreateHabitPayload>): Promise<{ message: string; habit: Habit }> {
    return apiFetch<{ message: string; habit: Habit }>(`/api/habits/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async deleteHabit(id: number): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/api/habits/${id}`, {
      method: "DELETE",
    });
  },
};
