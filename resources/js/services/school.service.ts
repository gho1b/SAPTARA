import { apiFetch } from "../lib/api-client";
import type { School } from "../types";

const SELECTED_SCHOOL_KEY = "saptara_selected_school";

export const schoolService = {
  /**
   * Search active schools.
   */
  async getSchools(search: string = ""): Promise<School[]> {
    const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
    return apiFetch<School[]>(`/api/schools${query}`);
  },

  /**
   * Get single school details.
   */
  async getById(id: number): Promise<School> {
    return apiFetch<School>(`/api/schools/${id}`);
  },

  /**
   * Get remembered school from localStorage.
   */
  getStoredSchool(): School | null {
    const raw = localStorage.getItem(SELECTED_SCHOOL_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  /**
   * Save selected school in localStorage.
   */
  setStoredSchool(school: School | null): void {
    if (!school) {
      localStorage.removeItem(SELECTED_SCHOOL_KEY);
    } else {
      localStorage.setItem(SELECTED_SCHOOL_KEY, JSON.stringify(school));
    }
  },
};

