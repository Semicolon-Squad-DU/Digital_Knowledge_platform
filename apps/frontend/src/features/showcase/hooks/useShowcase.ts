import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { ShowcaseFilterParams, StudentProject } from "@dkp/shared";

export function useShowcaseGallery(params: ShowcaseFilterParams) {
  return useQuery({
    queryKey: ["showcase", "gallery", params],
    queryFn: async () => {
      const { data } = await api.get("/showcase", { params });
      return data.data;
    },
    staleTime: 30_000,
  });
}

export function useShowcaseItem(id: string) {
  return useQuery({
    queryKey: ["showcase", "item", id],
    queryFn: async () => {
      const { data } = await api.get(`/showcase/${id}`);
      return data.data as StudentProject;
    },
    enabled: !!id,
  });
}

export function usePendingReviewQueue() {
  return useQuery({
    queryKey: ["showcase", "queue", "pending"],
    queryFn: async () => {
      const { data } = await api.get("/showcase/queue/pending");
      return data.data as StudentProject[];
    },
  });
}

export function useSubmitProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post("/showcase", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.data as StudentProject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["showcase", "gallery"] });
    },
  });
}

export function useReviewProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      action,
      comments,
    }: {
      id: string;
      action: "approve" | "request_changes";
      comments?: string;
    }) => {
      const { data } = await api.patch(`/showcase/${id}/review`, { action, comments });
      return data.data as StudentProject;
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["showcase", "item", id] });
      queryClient.invalidateQueries({ queryKey: ["showcase", "queue", "pending"] });
      queryClient.invalidateQueries({ queryKey: ["showcase", "gallery"] });
    },
  });
}
