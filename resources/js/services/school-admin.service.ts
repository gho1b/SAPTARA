import {
  apiFetch,
  setSchoolAdminToken,
  getSchoolAdminToken,
  removeSchoolAdminToken,
  setSchoolAdminUser,
  getSchoolAdminUser,
  setSchoolAdminSchool,
  getSchoolAdminSchool,
} from "../lib/api-client";
import type { School, Student, Teacher, SchoolClass } from "../types";

export interface SchoolAdminDashboardData {
  school: School;
  stats: {
    total_teachers: number;
    total_classes: number;
    total_students: number;
    linked_parents_count: number;
  };
  recent_students: Student[];
  classes: Array<SchoolClass & { students_count?: number; teacher?: { user?: { name: string } } }>;
}

export const schoolAdminService = {
  async login(schoolId: number, email: string, password: string): Promise<{ token: string; user: any; school: any }> {
    const res = await apiFetch<{ success: boolean; token: string; user: any; school: any }>(
      "/api/school-admin/login",
      {
        method: "POST",
        body: JSON.stringify({
          school_id: schoolId,
          email,
          password,
        }),
      }
    );

    setSchoolAdminToken(res.token);
    setSchoolAdminUser(res.user);
    setSchoolAdminSchool(res.school);
    return res;
  },

  async me(): Promise<{ user: any; school: any }> {
    const res = await apiFetch<{ user: any; school: any }>("/api/school-admin/me");
    setSchoolAdminUser(res.user);
    setSchoolAdminSchool(res.school);
    return res;
  },

  logout(): void {
    apiFetch("/api/school-admin/logout", { method: "POST" }).catch(() => {});
    removeSchoolAdminToken();
  },

  isAuthenticated(): boolean {
    return !!getSchoolAdminToken();
  },

  getStoredUser(): any | null {
    return getSchoolAdminUser();
  },

  getStoredSchool(): any | null {
    return getSchoolAdminSchool();
  },

  async getDashboardStats(): Promise<SchoolAdminDashboardData> {
    return apiFetch<SchoolAdminDashboardData>("/api/school-admin/dashboard/stats");
  },

  async getProfile(): Promise<School> {
    return apiFetch<School>("/api/school-admin/profile");
  },

  async updateProfile(data: FormData | Record<string, any>): Promise<{ success: boolean; message: string; school: School }> {
    const isFormData = data instanceof FormData;
    return apiFetch<{ success: boolean; message: string; school: School }>("/api/school-admin/profile", {
      method: "POST",
      body: isFormData ? data : JSON.stringify(data),
    });
  },

  async getTeachers(): Promise<any[]> {
    return apiFetch<any[]>("/api/school-admin/teachers");
  },

  async createTeacher(data: { name: string; email: string; password: string; display_name?: string }): Promise<{ success: boolean; message: string; teacher: any }> {
    return apiFetch<{ success: boolean; message: string; teacher: any }>("/api/school-admin/teachers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async resetTeacherPassword(id: number, password: string): Promise<{ success: boolean; message: string }> {
    return apiFetch<{ success: boolean; message: string }>(`/api/school-admin/teachers/${id}/reset-password`, {
      method: "PUT",
      body: JSON.stringify({ password }),
    });
  },

  async deleteTeacher(id: number): Promise<{ success: boolean; message: string }> {
    return apiFetch<{ success: boolean; message: string }>(`/api/school-admin/teachers/${id}`, {
      method: "DELETE",
    });
  },

  async getClasses(): Promise<any[]> {
    return apiFetch<any[]>("/api/school-admin/classes");
  },

  async createClass(data: { class_code: string; ship_name?: string; teacher_id: number; semester?: string; tahun_ajaran?: string }): Promise<{ success: boolean; message: string; class: any }> {
    return apiFetch<{ success: boolean; message: string; class: any }>("/api/school-admin/classes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateClass(id: number, data: { class_code: string; ship_name?: string; teacher_id: number; semester?: string; tahun_ajaran?: string }): Promise<{ success: boolean; message: string; class: any }> {
    return apiFetch<{ success: boolean; message: string; class: any }>(`/api/school-admin/classes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async deleteClass(id: number): Promise<{ success: boolean; message: string }> {
    return apiFetch<{ success: boolean; message: string }>(`/api/school-admin/classes/${id}`, {
      method: "DELETE",
    });
  },

  async getStudents(params: { class_id?: number; search?: string; page?: number; per_page?: number } = {}): Promise<any> {
    const query = new URLSearchParams();
    if (params.class_id) query.append("class_id", String(params.class_id));
    if (params.search) query.append("search", params.search);
    if (params.page) query.append("page", String(params.page));
    if (params.per_page) query.append("per_page", String(params.per_page));

    const qs = query.toString();
    return apiFetch<any>(`/api/school-admin/students${qs ? `?${qs}` : ""}`);
  },

  async createStudent(data: { class_id: number; name: string; nis?: string; access_code?: string; avatar?: string; parent_email?: string }): Promise<{ success: boolean; message: string; student: any }> {
    return apiFetch<{ success: boolean; message: string; student: any }>("/api/school-admin/students", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateStudent(id: number, data: { class_id?: number; name?: string; nis?: string; access_code?: string; avatar?: string; parent_email?: string }): Promise<{ success: boolean; message: string; student: any }> {
    return apiFetch<{ success: boolean; message: string; student: any }>(`/api/school-admin/students/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async resetStudentPin(id: number): Promise<{ success: boolean; message: string; access_code: string }> {
    return apiFetch<{ success: boolean; message: string; access_code: string }>(`/api/school-admin/students/${id}/reset-code`, {
      method: "PATCH",
    });
  },

  async deleteStudent(id: number): Promise<{ success: boolean; message: string }> {
    return apiFetch<{ success: boolean; message: string }>(`/api/school-admin/students/${id}`, {
      method: "DELETE",
    });
  },

  async getParents(): Promise<any[]> {
    return apiFetch<any[]>("/api/school-admin/parents");
  },

  async linkParent(studentId: number, parentEmail: string): Promise<{ success: boolean; message: string; student: any }> {
    return apiFetch<{ success: boolean; message: string; student: any }>("/api/school-admin/parents/link", {
      method: "POST",
      body: JSON.stringify({
        student_id: studentId,
        parent_email: parentEmail,
      }),
    });
  },
};

