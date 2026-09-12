import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { habitService, type CreateHabitPayload } from "../services/habit.service";
import { studentKeys } from "./use-students";
import { questKeys } from "./use-quests";

export const habitKeys = {
  all: ["habits"] as const,
  byClass: (classId?: number) => ["habits", "class", classId] as const,
  missions: (studentId: number) => ["habits", "missions", studentId] as const,
};

export function useHabits(classId?: number) {
  return useQuery({
    queryKey: habitKeys.byClass(classId),
    queryFn: () => habitService.getAll(classId),
  });
}

export function useTodayMissions(studentId: number) {
  return useQuery({
    queryKey: habitKeys.missions(studentId),
    queryFn: () => habitService.getTodayMissions(studentId),
    enabled: !!studentId,
  });
}

export function useToggleHabit(studentId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (habitId: number) => habitService.toggleHabit(habitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.missions(studentId) });
      queryClient.invalidateQueries({ queryKey: studentKeys.dashboard(studentId) });
      queryClient.invalidateQueries({ queryKey: studentKeys.compass(studentId) });
      queryClient.invalidateQueries({ queryKey: studentKeys.weekly(studentId) });
      queryClient.invalidateQueries({ queryKey: questKeys.byStudent(studentId) });
    },
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateHabitPayload) => habitService.createHabit(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: habitKeys.byClass(variables.class_id) });
      queryClient.invalidateQueries({ queryKey: habitKeys.all });
    },
  });
}

export function useUpdateHabit(classId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CreateHabitPayload> }) =>
      habitService.updateHabit(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.byClass(classId) });
      queryClient.invalidateQueries({ queryKey: habitKeys.all });
    },
  });
}

export function useDeleteHabit(classId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => habitService.deleteHabit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.byClass(classId) });
      queryClient.invalidateQueries({ queryKey: habitKeys.all });
    },
  });
}
