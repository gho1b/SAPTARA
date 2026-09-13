import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { logbookService } from "../services/logbook.service";
import type { SubmitLogbookPayload } from "../types";
import { studentKeys } from "./use-students";
import { habitKeys } from "./use-habits";

export const logbookKeys = {
  byStudent: (id: number) => ["logbook", "student", id] as const,
  byClass: (id: number) => ["logbook", "class", id] as const,
  pending: (id: number) => ["logbook", "pending", id] as const,
};

export function useStudentLogbook(studentId: number) {
  return useQuery({
    queryKey: logbookKeys.byStudent(studentId),
    queryFn: () => logbookService.getByStudent(studentId),
    enabled: !!studentId,
  });
}

export function useClassLogbook(classId: number) {
  return useQuery({
    queryKey: logbookKeys.byClass(classId),
    queryFn: () => logbookService.getByClass(classId),
    enabled: !!classId,
  });
}

export function usePendingLogbook(classId: number) {
  return useQuery({
    queryKey: logbookKeys.pending(classId),
    queryFn: () => logbookService.getPending(classId),
    enabled: !!classId,
  });
}

export function useSubmitLogbook(studentId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitLogbookPayload) => logbookService.submitEntry(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: logbookKeys.byStudent(studentId) });
      queryClient.invalidateQueries({ queryKey: habitKeys.missions(studentId) });
      queryClient.invalidateQueries({ queryKey: studentKeys.dashboard(studentId) });
    },
  });
}

export function useVerifyLogbook(classId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, comment, sticker }: { entryId: number; comment?: string; sticker?: string }) =>
      logbookService.verify(entryId, comment, sticker),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: logbookKeys.pending(classId) });
      queryClient.invalidateQueries({ queryKey: logbookKeys.byClass(classId) });
    },
  });
}

export function useRejectLogbook(classId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, comment }: { entryId: number; comment?: string }) =>
      logbookService.reject(entryId, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: logbookKeys.pending(classId) });
      queryClient.invalidateQueries({ queryKey: logbookKeys.byClass(classId) });
    },
  });
}

export function useBatchVerifyLogbook(classId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entryIds, comment, sticker }: { entryIds: number[]; comment?: string; sticker?: string }) =>
      logbookService.batchVerify(entryIds, comment, sticker),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: logbookKeys.pending(classId) });
      queryClient.invalidateQueries({ queryKey: logbookKeys.byClass(classId) });
    },
  });
}

export function useAddParentComment(studentId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, comment }: { entryId: number; comment: string }) =>
      logbookService.addParentComment(entryId, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: logbookKeys.byStudent(studentId) });
    },
  });
}
