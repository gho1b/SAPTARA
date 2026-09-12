/**
 * Base API Client
 *
 * Provides a typed fetch wrapper for all API calls.
 * - Teacher requests: use credentials (cookie-based session via Better Auth)
 * - Student requests: use Authorization Bearer token (JWT stored in localStorage)
 */

const API_BASE = import.meta.env.VITE_API_BASE || "";

/**
 * Get the stored student JWT token from localStorage
 */
export function getStudentToken(): string | null {
  return localStorage.getItem("saptara_student_token");
}

/**
 * Store student JWT token in localStorage
 */
export function setStudentToken(token: string): void {
  localStorage.setItem("saptara_student_token", token);
}

/**
 * Remove student JWT token from localStorage
 */
export function removeStudentToken(): void {
  localStorage.removeItem("saptara_student_token");
}

/**
 * Get stored student info from localStorage
 */
export function getStoredStudentInfo(): { studentId: number; classId: number; name: string; avatar: string } | null {
  const raw = localStorage.getItem("saptara_student_info");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Store student info in localStorage
 */
export function setStudentInfo(info: { studentId: number; classId: number; name: string; avatar: string }): void {
  localStorage.setItem("saptara_student_info", JSON.stringify(info));
}

/**
 * Remove student info from localStorage
 */
export function removeStudentInfo(): void {
  localStorage.removeItem("saptara_student_info");
}

/**
 * Core fetch wrapper — sends credentials (cookies) and JSON content type
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Don't set Content-Type for FormData (browser sets boundary automatically)
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
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

/**
 * Fetch wrapper with student JWT auth header
 */
export async function apiStudentFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStudentToken();
  if (!token) {
    throw new Error("No student token found — please login first");
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...(options.headers as Record<string, string>),
  };

  // Don't set Content-Type for FormData
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

// ── Parent Auth Helpers ──

export function getParentToken(): string | null {
  return localStorage.getItem("saptara_parent_token");
}

export function setParentToken(token: string): void {
  localStorage.setItem("saptara_parent_token", token);
}

export function removeParentToken(): void {
  localStorage.removeItem("saptara_parent_token");
}

export function getStoredParentInfo(): {
  studentId: number;
  classId: number;
  studentName: string;
  studentAvatar: string;
} | null {
  const raw = localStorage.getItem("saptara_parent_info");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setParentInfo(info: {
  studentId: number;
  classId: number;
  studentName: string;
  studentAvatar: string;
}): void {
  localStorage.setItem("saptara_parent_info", JSON.stringify(info));
}

export function removeParentInfo(): void {
  localStorage.removeItem("saptara_parent_info");
}

/**
 * Fetch wrapper with parent JWT auth header
 */
export async function apiParentFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getParentToken();
  if (!token) {
    throw new Error("No parent token found — please login first");
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...(options.headers as Record<string, string>),
  };

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
