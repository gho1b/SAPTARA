import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "../services/auth.service";
import { useSession, signIn, signUp, signOut } from "../lib/auth-client";
import type { Teacher, StudentLoginResponse, ParentLoginResponse } from "../types";
import { getStoredStudentInfo, getStoredParentInfo } from "../lib/api-client";

// ════════════════════════════════════════════
// Teacher Auth Hooks (Better Auth)
// ════════════════════════════════════════════

/**
 * Hook: Get current teacher session from Better Auth.
 * Returns { data: session, isPending, error } with user + session info.
 */
export function useTeacherSession() {
  return useSession();
}

/**
 * Hook: Sign in teacher via email + password.
 */
export function useTeacherSignIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const result = await signIn.email({ email, password });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
  });
}

/**
 * Hook: Sign up teacher via email + password + name.
 */
export function useTeacherSignUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      email,
      password,
      name,
    }: {
      email: string;
      password: string;
      name: string;
    }) => {
      const result = await signUp.email({ email, password, name });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
  });
}

/**
 * Hook: Sign out teacher.
 */
export function useTeacherSignOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await signOut();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session"] });
      queryClient.clear();
    },
  });
}

/**
 * Hook: Create teacher profile after registration.
 */
export function useCreateTeacherProfile() {
  return useMutation<Teacher, Error, string>({
    mutationFn: (displayName: string) =>
      authService.createTeacherProfile(displayName),
  });
}

// ════════════════════════════════════════════
// Student Auth Hooks (JWT)
// ════════════════════════════════════════════

/**
 * Hook: Student login (name + classCode → JWT).
 */
export function useStudentLogin() {
  const queryClient = useQueryClient();
  return useMutation<
    StudentLoginResponse,
    Error,
    { name: string; classCode: string }
  >({
    mutationFn: ({ name, classCode }) =>
      authService.studentLogin(name, classCode),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}

/**
 * Hook: Student logout (clears localStorage).
 */
export function useStudentLogout() {
  const queryClient = useQueryClient();
  return {
    logout: () => {
      authService.studentLogout();
      queryClient.clear();
    },
  };
}

/**
 * Hook: Get current student info from localStorage.
 * Returns null if not logged in.
 */
export function useStudentInfo() {
  return getStoredStudentInfo();
}

// ════════════════════════════════════════════
// Parent Auth Hooks (JWT)
// ════════════════════════════════════════════

/**
 * Hook: Parent login (nama anak + classCode → JWT with role "parent").
 */
export function useParentLogin() {
  const queryClient = useQueryClient();
  return useMutation<
    ParentLoginResponse,
    Error,
    { name: string; classCode: string }
  >({
    mutationFn: ({ name, classCode }) =>
      authService.parentLogin(name, classCode),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}

/**
 * Hook: Parent logout (clears localStorage).
 */
export function useParentLogout() {
  const queryClient = useQueryClient();
  return {
    logout: () => {
      authService.parentLogout();
      queryClient.clear();
    },
  };
}

/**
 * Hook: Get current parent info from localStorage.
 * Returns null if not logged in as parent.
 */
export function useParentInfo() {
  return getStoredParentInfo();
}
