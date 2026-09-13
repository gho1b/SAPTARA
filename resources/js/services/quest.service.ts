import { apiFetch } from "../lib/api-client";
import type { DailyQuestsResponse } from "../types";

export interface ClaimQuestResponse {
  message: string;
  quest_key: string;
  rewardXp: number;
  rewardCoins: number;
  student: {
    xp: number;
    coins: number;
    level: number;
  };
}

export const questService = {
  async getQuests(studentId: number): Promise<DailyQuestsResponse> {
    return apiFetch<DailyQuestsResponse>(`/api/students/${studentId}/quests`);
  },

  async claimQuest(studentId: number, questKey: string): Promise<ClaimQuestResponse> {
    return apiFetch<ClaimQuestResponse>(`/api/students/${studentId}/quests/${questKey}/claim`, {
      method: "POST",
    });
  },
};
