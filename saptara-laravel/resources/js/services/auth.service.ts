import {
  apiFetch,
  setStudentToken,
  setStudentInfo,
  removeStudentToken,
  setParentToken,
  setParentInfo,
  removeParentToken,
  setTeacherToken,
  setTeacherInfo,
  removeTeacherToken,
  getTeacherInfo,
} from "../lib/api-client";
import type { StudentLoginResponse, ParentLoginResponse } from "../types";

export const authService = {
  // Student Login
  async studentLogin(name: string, classCode: string): Promise<StudentLoginResponse> {
    const result = await apiFetch<StudentLoginResponse>("/api/auth/student/login", {
      method: "POST",
      body: JSON.stringify({ name, classCode }),
    });
    setStudentToken(result.token);
    setStudentInfo(result.student);
    return result;
  },

  // Student Logout
  studentLogout(): void {
    removeStudentToken();
  },

  // Parent Login
  async parentLogin(studentName: string, classCode: string): Promise<ParentLoginResponse> {
    const result = await apiFetch<ParentLoginResponse>("/api/auth/parent/login", {
      method: "POST",
      body: JSON.stringify({ studentName, classCode }),
    });
    setParentToken(result.token);
    setParentInfo(result.parent);
    return result;
  },

  // Parent Logout
  parentLogout(): void {
    removeParentToken();
  },

  // Teacher Login
  async teacherLogin(email: string, password: string): Promise<{ token: string; teacher: any }> {
    const result = await apiFetch<any>("/api/auth/teacher/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setTeacherToken(result.token);
    setTeacherInfo(result.teacher);
    return result;
  },

  // Teacher Register
  async teacherRegister(name: string, email: string, password: string): Promise<{ token: string; teacher: any }> {
    const result = await apiFetch<any>("/api/auth/teacher/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    setTeacherToken(result.token);
    setTeacherInfo(result.teacher);
    return result;
  },

  // Teacher Me
  async teacherMe(): Promise<any> {
    return apiFetch<any>("/api/auth/me");
  },

  // Teacher Logout
  async teacherLogout(): Promise<void> {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore network errors on logout
    }
    removeTeacherToken();
  },

  getStoredTeacher() {
    return getTeacherInfo();
  },
};
