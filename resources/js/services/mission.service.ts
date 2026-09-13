import { apiFetch } from "../lib/api-client";
import type { ClassMission, CreateClassMissionPayload } from "../types";

export interface ClaimClassMissionResponse {
  message: string;
  rewardXp: number;
  rewardCoins: number;
  student: {
    xp: number;
    coins: number;
    level: number;
  };
}

export const missionService = {
  async getMissions(classId: number, studentId?: number): Promise<ClassMission[]> {
    const url = studentId
      ? `/api/classes/${classId}/missions?student_id=${studentId}`
      : `/api/classes/${classId}/missions`;
    return apiFetch<ClassMission[]>(url);
  },

  async createMission(classId: number, payload: CreateClassMissionPayload): Promise<{ message: string; mission: ClassMission }> {
    return apiFetch<{ message: string; mission: ClassMission }>(`/api/classes/${classId}/missions`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async claimMission(missionId: number): Promise<ClaimClassMissionResponse> {
    return apiFetch<ClaimClassMissionResponse>(`/api/missions/${missionId}/claim`, {
      method: "POST",
    });
  },
};
