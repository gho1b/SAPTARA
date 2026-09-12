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

  // Parent Login (Quick childName + classCode)
  async parentLogin(studentName: string, classCode: string): Promise<ParentLoginResponse> {
    const result = await apiFetch<ParentLoginResponse>("/api/auth/parent/login", {
      method: "POST",
      body: JSON.stringify({ studentName, classCode }),
    });
    setParentToken(result.token);
    setParentInfo({
      ...result.parent,
      children: result.children ?? [],
      user: result.user,
    });
    return result;
  },

  // Parent Login with Email & Password
  async parentLoginWithEmail(email: string, password: string): Promise<ParentLoginResponse> {
    const result = await apiFetch<ParentLoginResponse>("/api/auth/parent/login-email", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setParentToken(result.token);
    setParentInfo({
      ...result.parent,
      children: result.children ?? [],
      user: result.user,
    });
    return result;
  },

  // Parent Register (Email, Password, Optional first child)
  async parentRegister(payload: {
    name: string;
    email: string;
    password: string;
    studentName?: string;
    classCode?: string;
  }): Promise<ParentLoginResponse> {
    const result = await apiFetch<ParentLoginResponse>("/api/auth/parent/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setParentToken(result.token);
    setParentInfo({
      ...result.parent,
      children: result.children ?? [],
      user: result.user,
    });
    return result;
  },

  // Parent Link additional child
  async parentLinkChild(childName: string, classCode: string): Promise<{ message: string; child: any; children: any[] }> {
    const result = await apiFetch<{ message: string; child: any; children: any[] }>("/api/auth/parent/link-child", {
      method: "POST",
      body: JSON.stringify({ childName, classCode }),
    });
    const currentInfo = getStoredParentInfo() || {};
    setParentInfo({
      ...currentInfo,
      children: result.children,
    });
    return result;
  },

  // Parent Switch active child
  async parentSwitchChild(childId: number): Promise<ParentLoginResponse> {
    const result = await apiFetch<ParentLoginResponse>(`/api/auth/parent/switch-child/${childId}`, {
      method: "POST",
    });
    setParentToken(result.token);
    const currentInfo = getStoredParentInfo() || {};
    setParentInfo({
      ...currentInfo,
      studentId: result.parent.studentId,
      classId: result.parent.classId,
      studentName: result.parent.studentName,
      studentAvatar: result.parent.studentAvatar,
      children: result.children ?? currentInfo.children,
    });
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
