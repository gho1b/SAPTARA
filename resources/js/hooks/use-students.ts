import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentService } from "../services/student.service";
import type { CreateStudentPayload } from "../types";

export const studentKeys = {
  detail: (id: number) => ["student", id] as const,
  dashboard: (id: number) => ["student", id, "dashboard"] as const,
  weekly: (id: number) => ["student", id, "weekly"] as const,
  compass: (id: number) => ["student", id, "compass"] as const,
  leaderboard: (classId: number) => ["leaderboard", classId] as const,
  byClass: (classId: number) => ["students", "class", classId] as const,
};

export function useStudent(id: number) {
  return useQuery({
    queryKey: studentKeys.detail(id),
    queryFn: () => studentService.getById(id),
    enabled: !!id,
  });
}

export function useStudentDashboard(id: number) {
  return useQuery({
    queryKey: studentKeys.dashboard(id),
    queryFn: () => studentService.getDashboard(id),
    enabled: !!id,
  });
}

export function useStudentWeekly(id: number) {
  return useQuery({
    queryKey: studentKeys.weekly(id),
    queryFn: () => studentService.getWeeklyData(id),
    enabled: !!id,
  });
}

export function useStudentCompass(id: number) {
  return useQuery({
    queryKey: studentKeys.compass(id),
    queryFn: () => studentService.getCompassData(id),
    enabled: !!id,
  });
}

export function useLeaderboard(classId: number) {
  return useQuery({
    queryKey: studentKeys.leaderboard(classId),
    queryFn: () => studentService.getLeaderboard(classId),
    enabled: !!classId,
  });
}

export function useStudentsByClass(classId: number) {
  return useQuery({
    queryKey: studentKeys.byClass(classId),
    queryFn: () => studentService.getByClass(classId),
    enabled: !!classId,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStudentPayload) => studentService.createStudent(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: studentKeys.byClass(variables.classId) });
      queryClient.invalidateQueries({ queryKey: studentKeys.leaderboard(variables.classId) });
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CreateStudentPayload> }) =>
      studentService.updateStudent(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => studentService.deleteStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}

export function useResetStudentCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, accessCode }: { id: number; accessCode?: string }) =>
      studentService.resetStudentCode(id, accessCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}
