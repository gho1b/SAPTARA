import { apiFetch } from "../lib/api-client";
import type { LogbookEntry, SubmitLogbookPayload } from "../types";

export const logbookService = {
  async submitEntry(payload: SubmitLogbookPayload): Promise<LogbookEntry> {
    const formData = new FormData();
    formData.append("habitId", payload.habitId.toString());
    formData.append("caption", payload.caption);
    if (payload.photo) {
      formData.append("photo", payload.photo);
    }
    return apiFetch<LogbookEntry>("/api/logbook", {
      method: "POST",
      body: formData,
    });
  },

  async getByStudent(studentId: number): Promise<LogbookEntry[]> {
    return apiFetch<LogbookEntry[]>(`/api/logbook/student/${studentId}`);
  },

  async getByClass(classId: number): Promise<LogbookEntry[]> {
    return apiFetch<LogbookEntry[]>(`/api/logbook/class/${classId}`);
  },

  async getPending(classId: number): Promise<LogbookEntry[]> {
    return apiFetch<LogbookEntry[]>(`/api/logbook/pending/${classId}`);
  },

  async verify(entryId: number, comment?: string, sticker?: string): Promise<LogbookEntry> {
    return apiFetch<LogbookEntry>(`/api/logbook/${entryId}/verify`, {
      method: "PATCH",
      body: JSON.stringify({ comment, sticker }),
    });
  },

  async reject(entryId: number, comment?: string): Promise<LogbookEntry> {
    return apiFetch<LogbookEntry>(`/api/logbook/${entryId}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ comment }),
    });
  },

  async batchVerify(entryIds: number[], comment?: string, sticker?: string): Promise<any> {
    return apiFetch<any>("/api/logbook/batch-verify", {
      method: "POST",
      body: JSON.stringify({ entryIds, comment, sticker }),
    });
  },

  async addParentComment(entryId: number, comment: string): Promise<LogbookEntry> {
    return apiFetch<LogbookEntry>(`/api/logbook/${entryId}/parent-comment`, {
      method: "POST",
      body: JSON.stringify({ comment }),
    });
  },
};
