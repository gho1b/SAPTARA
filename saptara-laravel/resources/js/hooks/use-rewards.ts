import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rewardService } from "../services/reward.service";
import { studentKeys } from "./use-students";

export const rewardKeys = {
  badges: (studentId: number) => ["rewards", "badges", studentId] as const,
  accessories: ["rewards", "accessories"] as const,
  studentAccessories: (studentId: number) => ["rewards", "studentAccessories", studentId] as const,
};

export function useStudentBadges(studentId: number) {
  return useQuery({
    queryKey: rewardKeys.badges(studentId),
    queryFn: () => rewardService.getBadges(studentId),
    enabled: !!studentId,
  });
}

export function useAccessories() {
  return useQuery({
    queryKey: rewardKeys.accessories,
    queryFn: () => rewardService.getAccessories(),
  });
}

export function useStudentAccessories(studentId: number) {
  return useQuery({
    queryKey: rewardKeys.studentAccessories(studentId),
    queryFn: () => rewardService.getStudentAccessories(studentId),
    enabled: !!studentId,
  });
}

export function usePurchaseAccessory(studentId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (accessoryId: string) => rewardService.purchaseAccessory(accessoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rewardKeys.studentAccessories(studentId) });
      queryClient.invalidateQueries({ queryKey: studentKeys.dashboard(studentId) });
    },
  });
}

export function useAwardBadge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, habitId }: { studentId: number; habitId: number }) =>
      rewardService.awardBadge(studentId, habitId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: rewardKeys.badges(variables.studentId) });
    },
  });
}

export function useSendBottleMessage() {
  return useMutation({
    mutationFn: ({ studentId, comment, sticker }: { studentId: number; comment: string; sticker?: string }) =>
      rewardService.sendBottleMessage(studentId, comment, sticker),
  });
}
