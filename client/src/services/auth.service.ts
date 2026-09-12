import { apiFetch } from "../lib/api-client";
import type { Teacher, StudentLoginResponse, ParentLoginResponse } from "../types";
import {
  setStudentToken,
  setStudentInfo,
  removeStudentToken,
  removeStudentInfo,
  setParentToken,
  setParentInfo,
  removeParentToken,
  removeParentInfo,
} from "../lib/api-client";

/**
 * Auth Service
 *
 * Handles:
 * - Teacher profile creation (after Better Auth sign-up)
 * - Student login (name + classCode → JWT)
 * - Student logout (clear localStorage)
 * - Parent login (nama anak + classCode → JWT with role "parent")
 * - Parent logout (clear localStorage)
 *
 * Note: Teacher sign-up/sign-in/sign-out are handled directly
 * by Better Auth client (see lib/auth-client.ts).
 */
export const authService = {
  /**
   * Create or retrieve teacher profile after Better Auth registration.
   * POST /api/auth/teacher/profile
   */
  async createTeacherProfile(displayName: string): Promise<Teacher> {
    return apiFetch<Teacher>("/api/auth/teacher/profile", {
      method: "POST",
      body: JSON.stringify({ displayName }),
    });
  },

  /**
   * Student login via name + class code.
   * Returns a JWT token + student info.
   * POST /api/auth/student/login
   */
  async studentLogin(
    name: string,
    classCode: string
  ): Promise<StudentLoginResponse> {
    const result = await apiFetch<StudentLoginResponse>(
      "/api/auth/student/login",
      {
        method: "POST",
        body: JSON.stringify({ name, classCode }),
      }
    );

    // Store token & student info in localStorage
    setStudentToken(result.token);
    setStudentInfo(result.student);

    return result;
  },

  /**
   * Student logout — clears the JWT token and student info from localStorage.
   */
  studentLogout(): void {
    removeStudentToken();
    removeStudentInfo();
  },

  /**
   * Parent login via nama anak + class code.
   * Returns a JWT token with role "parent" + parent info.
   * POST /api/auth/parent/login
   */
  async parentLogin(
    name: string,
    classCode: string
  ): Promise<ParentLoginResponse> {
    const result = await apiFetch<ParentLoginResponse>(
      "/api/auth/parent/login",
      {
        method: "POST",
        body: JSON.stringify({ name, classCode }),
      }
    );

    // Store token & parent info in localStorage
    setParentToken(result.token);
    setParentInfo(result.parent);

    return result;
  },

  /**
   * Parent logout — clears the JWT token and parent info from localStorage.
   */
  parentLogout(): void {
    removeParentToken();
    removeParentInfo();
  },
};

