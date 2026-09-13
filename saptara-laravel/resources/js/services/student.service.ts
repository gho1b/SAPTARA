import { apiFetch } from "../lib/api-client";
import type {
  Student,
  StudentDashboard,
  WeeklyData,
  CompassData,
  LeaderboardEntry,
  CreateStudentPayload,
} from "../types";

export const studentService = {
  async getById(id: number): Promise<Student> {
    return apiFetch<Student>(`/api/students/profile/${id}`);
  },

  async getDashboard(id: number): Promise<StudentDashboard> {
    return apiFetch<StudentDashboard>(`/api/students/${id}/dashboard`);
  },

  async getWeeklyData(id: number): Promise<WeeklyData[]> {
    return apiFetch<WeeklyData[]>(`/api/students/${id}/weekly`);
  },

  async getCompassData(id: number): Promise<CompassData[]> {
    return apiFetch<CompassData[]>(`/api/students/${id}/compass`);
  },

  async getLeaderboard(classId: number): Promise<LeaderboardEntry[]> {
    return apiFetch<LeaderboardEntry[]>(`/api/students/${classId}/leaderboard`);
  },

  async getByClass(classId: number): Promise<Student[]> {
    return apiFetch<Student[]>(`/api/students/${classId}/list`);
  },

  async createStudent(payload: CreateStudentPayload): Promise<Student> {
    return apiFetch<Student>("/api/students", {
      method: "POST",
      body: JSON.stringify({
        class_id: payload.classId,
        classId: payload.classId,
        name: payload.name,
        avatar: payload.avatar,
        nis: payload.nis,
        access_code: payload.accessCode,
      }),
    });
  },

  async resetStudentCode(id: number, accessCode?: string): Promise<{ success: boolean; message: string; access_code: string; student: Student }> {
    return apiFetch<{ success: boolean; message: string; access_code: string; student: Student }>(`/api/students/${id}/reset-code`, {
      method: "PATCH",
      body: JSON.stringify({
        access_code: accessCode,
      }),
    });
  },

  async deleteStudent(id: number): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/api/students/${id}`, {
      method: "DELETE",
    });
  },
};
