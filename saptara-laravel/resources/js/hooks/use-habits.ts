import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { habitService } from "../services/habit.service";
import { studentKeys } from "./use-students";

export const habitKeys = {
  all: ["habits"] as const,
  missions: (studentId: number) => ["habits", "missions", studentId] as const,
};

export function useHabits() {
  return useQuery({
    queryKey: habitKeys.all,
    queryFn: () => habitService.getAll(),
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
    },
  });
}
