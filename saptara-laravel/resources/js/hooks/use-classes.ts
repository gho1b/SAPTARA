import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { classService } from "../services/class.service";
import type { CreateClassPayload } from "../types";

export const classKeys = {
  all: ["classes"] as const,
  detail: (id: number) => ["class", id] as const,
};

export function useClasses() {
  return useQuery({
    queryKey: classKeys.all,
    queryFn: () => classService.getAll(),
  });
}

export function useClass(id: number) {
  return useQuery({
    queryKey: classKeys.detail(id),
    queryFn: () => classService.getById(id),
    enabled: !!id,
  });
}

export function useCreateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateClassPayload) => classService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.all });
    },
  });
}

export function useDeleteClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => classService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.all });
    },
  });
}
