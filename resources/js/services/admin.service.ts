import {
  apiFetch,
  setAdminToken,
  getAdminToken,
  removeAdminToken,
  setAdminUser,
  getAdminUser,
} from "../lib/api-client";
import type { School } from "../types";

export interface AdminStats {
  total_schools: number;
  active_schools: number;
  inactive_schools: number;
  total_teachers: number;
  total_students: number;
  total_classes: number;
  total_habit_logs: number;
  recent_schools: Array<School & { classes_count?: number; teachers_count?: number; students_count?: number }>;
}

export interface PaginatedSchools {
  current_page: number;
  data: Array<School & { classes_count?: number; teachers_count?: number; students_count?: number }>;
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

export const adminService = {
  async login(email: string, password: string): Promise<{ token: string; user: any }> {
    const res = await apiFetch<{ token: string; user: any }>("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setAdminToken(res.token);
    setAdminUser(res.user);
    return res;
  },

  async me(): Promise<{ user: any }> {
    return apiFetch<{ user: any }>("/api/admin/me");
  },

  logout(): void {
    removeAdminToken();
  },

  isAuthenticated(): boolean {
    return !!getAdminToken();
  },

  getStoredUser(): any | null {
    return getAdminUser();
  },

  async getDashboardStats(): Promise<AdminStats> {
    return apiFetch<AdminStats>("/api/admin/dashboard/stats");
  },

  async getSchools(params: {
    search?: string;
    status?: string;
    page?: number;
    perPage?: number;
    city?: string;
    province?: string;
  } = {}): Promise<PaginatedSchools> {
    const query = new URLSearchParams();
    if (params.search) query.append("search", params.search);
    if (params.status && params.status !== "all") query.append("status", params.status);
    if (params.page) query.append("page", String(params.page));
    if (params.perPage) query.append("per_page", String(params.perPage));
    if (params.city) query.append("city", params.city);
    if (params.province) query.append("province", params.province);

    const qs = query.toString();
    return apiFetch<PaginatedSchools>(`/api/admin/schools${qs ? `?${qs}` : ""}`);
  },

  async getSchool(id: number): Promise<School & { classes: any[]; teachers: any[]; students_count?: number }> {
    return apiFetch<any>(`/api/admin/schools/${id}`);
  },

  async createSchool(data: FormData | Record<string, any>): Promise<{ success: boolean; message: string; school: School }> {
    const isFormData = data instanceof FormData;
    return apiFetch<{ success: boolean; message: string; school: School }>("/api/admin/schools", {
      method: "POST",
      body: isFormData ? data : JSON.stringify(data),
    });
  },

  async updateSchool(id: number, data: FormData | Record<string, any>): Promise<{ success: boolean; message: string; school: School }> {
    const isFormData = data instanceof FormData;
    return apiFetch<{ success: boolean; message: string; school: School }>(`/api/admin/schools/${id}`, {
      method: "POST",
      body: isFormData ? data : JSON.stringify(data),
    });
  },

  async toggleSchoolStatus(id: number): Promise<{ success: boolean; message: string; is_active: boolean; school: School }> {
    return apiFetch<{ success: boolean; message: string; is_active: boolean; school: School }>(
      `/api/admin/schools/${id}/toggle-status`,
      { method: "PATCH" }
    );
  },

  async deleteSchool(id: number): Promise<{ success: boolean; message: string }> {
    return apiFetch<{ success: boolean; message: string }>(`/api/admin/schools/${id}`, {
      method: "DELETE",
    });
  },

  async getSchoolAdminAccount(id: number): Promise<{ has_admin: boolean; admin: any | null }> {
    return apiFetch<{ has_admin: boolean; admin: any | null }>(`/api/admin/schools/${id}/admin-account`);
  },

  async saveSchoolAdminAccount(id: number, data: { name: string; email: string; password: string }): Promise<{ success: boolean; message: string; admin: any }> {
    return apiFetch<{ success: boolean; message: string; admin: any }>(`/api/admin/schools/${id}/admin-account`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

