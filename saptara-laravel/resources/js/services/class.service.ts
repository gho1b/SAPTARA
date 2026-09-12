import { apiFetch } from "../lib/api-client";
import type { Class, CreateClassPayload } from "../types";

export const classService = {
  async getAll(): Promise<Class[]> {
    return apiFetch<Class[]>("/api/classes");
  },

  async getById(id: number): Promise<Class> {
    return apiFetch<Class>(`/api/classes/${id}`);
  },

  async create(payload: CreateClassPayload): Promise<Class> {
    return apiFetch<Class>("/api/classes", {
      method: "POST",
      body: JSON.stringify({
        school_name: payload.schoolName,
        schoolName: payload.schoolName,
        class_code: payload.classCode,
        classCode: payload.classCode,
        ship_name: payload.shipName,
        shipName: payload.shipName,
      }),
    });
  },

  async delete(id: number): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/api/classes/${id}`, {
      method: "DELETE",
    });
  },
};
