import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { questService } from "../services/quest.service";
import { studentKeys } from "./use-students";

export const questKeys = {
  all: ["quests"] as const,
  byStudent: (studentId: number) => ["quests", studentId] as const,
};

export function useDailyQuests(studentId: number) {
  return useQuery({
    queryKey: questKeys.byStudent(studentId),
    queryFn: () => questService.getQuests(studentId),
    enabled: !!studentId,
  });
}

export function useClaimQuest(studentId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questKey: string) => questService.claimQuest(studentId, questKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questKeys.byStudent(studentId) });
      queryClient.invalidateQueries({ queryKey: studentKeys.dashboard(studentId) });
      queryClient.invalidateQueries({ queryKey: studentKeys.profile(studentId) });
    },
  });
}
