import { apiFetch } from "../lib/api-client";
import type { StudentBadge, StudentAccessory } from "../types";

export const rewardService = {
  async getBadges(studentId: number): Promise<StudentBadge[]> {
    return apiFetch<StudentBadge[]>(`/api/rewards/badges/${studentId}`);
  },

  async awardBadge(studentId: number, habitId: number): Promise<StudentBadge> {
    return apiFetch<StudentBadge>("/api/rewards/badges", {
      method: "POST",
      body: JSON.stringify({ studentId, habitId }),
    });
  },

  async getAccessories(): Promise<StudentAccessory[]> {
    return apiFetch<StudentAccessory[]>("/api/rewards/accessories");
  },

  async getStudentAccessories(studentId: number): Promise<StudentAccessory[]> {
    return apiFetch<StudentAccessory[]>(`/api/rewards/accessories/${studentId}`);
  },

  async purchaseAccessory(accessoryId: string): Promise<any> {
    return apiFetch<any>("/api/rewards/accessories/purchase", {
      method: "POST",
      body: JSON.stringify({ accessoryId }),
    });
  },

  async sendBottleMessage(studentId: number, comment: string, sticker?: string): Promise<any> {
    return apiFetch<any>("/api/rewards/message", {
      method: "POST",
      body: JSON.stringify({ studentId, comment, sticker }),
    });
  },
};
