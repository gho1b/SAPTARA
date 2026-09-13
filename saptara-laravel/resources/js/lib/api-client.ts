/**
 * Base API Client for SAPTARA Laravel
 *
 * Supports Student, Teacher (Sanctum Bearer), and Parent (JWT Bearer) authentication.
 */

const API_BASE = "";

// ── Teacher Auth Helpers ──
export function getTeacherToken(): string | null {
  return localStorage.getItem("saptara_teacher_token");
}
export function setTeacherToken(token: string): void {
  localStorage.setItem("saptara_teacher_token", token);
}
export function removeTeacherToken(): void {
  localStorage.removeItem("saptara_teacher_token");
  localStorage.removeItem("saptara_teacher_info");
}
export function getTeacherInfo(): any | null {
  const raw = localStorage.getItem("saptara_teacher_info");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
export function setTeacherInfo(info: any): void {
  localStorage.setItem("saptara_teacher_info", JSON.stringify(info));
}

// ── Student Auth Helpers ──
export function getStudentToken(): string | null {
  return localStorage.getItem("saptara_student_token");
}
export function setStudentToken(token: string): void {
  localStorage.setItem("saptara_student_token", token);
}
export function removeStudentToken(): void {
  localStorage.removeItem("saptara_student_token");
  localStorage.removeItem("saptara_student_info");
}
export function getStoredStudentInfo(): { studentId: number; classId: number; name: string; avatar: string } | null {
  const raw = localStorage.getItem("saptara_student_info");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
export function setStudentInfo(info: { studentId: number; classId: number; name: string; avatar: string }): void {
  localStorage.setItem("saptara_student_info", JSON.stringify(info));
}

// ── Parent Auth Helpers ──
export function getParentToken(): string | null {
  return localStorage.getItem("saptara_parent_token");
}
export function setParentToken(token: string): void {
  localStorage.setItem("saptara_parent_token", token);
}
export function removeParentToken(): void {
  localStorage.removeItem("saptara_parent_token");
  localStorage.removeItem("saptara_parent_info");
}
export function getStoredParentInfo(): any | null {
  const raw = localStorage.getItem("saptara_parent_info");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
export function setParentInfo(info: any): void {
  localStorage.setItem("saptara_parent_info", JSON.stringify(info));
}

// ── Admin Auth Helpers ──
export function getAdminToken(): string | null {
  return localStorage.getItem("saptara_admin_token");
}
export function setAdminToken(token: string): void {
  localStorage.setItem("saptara_admin_token", token);
}
export function removeAdminToken(): void {
  localStorage.removeItem("saptara_admin_token");
  localStorage.removeItem("saptara_admin_user");
}
export function getAdminUser(): any | null {
  const raw = localStorage.getItem("saptara_admin_user");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
export function setAdminUser(user: any): void {
  localStorage.setItem("saptara_admin_user", JSON.stringify(user));
}

// ── Universal Request Fetcher ──
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  // If no auth header explicitly set, auto-inject available token
  if (!headers["Authorization"]) {
    const adminToken = getAdminToken();
    const teacherToken = getTeacherToken();
    const studentToken = getStudentToken();
    const parentToken = getParentToken();

    if (path.includes("/admin") && adminToken) {
      headers["Authorization"] = `Bearer ${adminToken}`;
    } else if (adminToken && !teacherToken && !studentToken && !parentToken) {
      headers["Authorization"] = `Bearer ${adminToken}`;
    } else if (teacherToken) {
      headers["Authorization"] = `Bearer ${teacherToken}`;
    } else if (studentToken) {
      headers["Authorization"] = `Bearer ${studentToken}`;
    } else if (parentToken) {
      headers["Authorization"] = `Bearer ${parentToken}`;
    }
  }

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorBody = await res.text();
    let message: string;
    try {
      const parsed = JSON.parse(errorBody);
      message = parsed.error || parsed.message || errorBody;
    } catch {
      message = errorBody;
    }
    throw new Error(message);
  }

  return res.json();
}

export const apiStudentFetch = apiFetch;
export const apiParentFetch = apiFetch;
export const apiTeacherFetch = apiFetch;

export const apiClient = {
  get: <T>(url: string) => apiFetch<T>(url.startsWith("/api") ? url : `/api${url}`),
  post: <T>(url: string, body?: any) =>
    apiFetch<T>(url.startsWith("/api") ? url : `/api${url}`, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  patch: <T>(url: string, body?: any) =>
    apiFetch<T>(url.startsWith("/api") ? url : `/api${url}`, {
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  delete: <T>(url: string) =>
    apiFetch<T>(url.startsWith("/api") ? url : `/api${url}`, {
      method: "DELETE",
    }),
};
