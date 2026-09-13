import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { missionService } from "../services/mission.service";
import type { CreateClassMissionPayload } from "../types";
import { studentKeys } from "./use-students";

export const missionKeys = {
  all: ["class-missions"] as const,
  byClass: (classId: number, studentId?: number) => ["class-missions", classId, studentId] as const,
};

export function useClassMissions(classId: number, studentId?: number) {
  return useQuery({
    queryKey: missionKeys.byClass(classId, studentId),
    queryFn: () => missionService.getMissions(classId, studentId),
    enabled: !!classId,
  });
}

export function useCreateClassMission(classId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateClassMissionPayload) => missionService.createMission(classId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: missionKeys.all });
    },
  });
}

export function useClaimClassMission(classId: number, studentId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (missionId: number) => missionService.claimMission(missionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: missionKeys.all });
      if (studentId) {
        queryClient.invalidateQueries({ queryKey: studentKeys.dashboard(studentId) });
        queryClient.invalidateQueries({ queryKey: studentKeys.profile(studentId) });
      }
    },
  });
}
