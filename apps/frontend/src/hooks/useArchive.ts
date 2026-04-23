import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { ArchiveSearchParams } from "@dkp/shared";

export function useArchiveSearch(params: ArchiveSearchParams) {
  return useQuery({
    queryKey: ["archive", "search", params],
    queryFn: async () => {
      const { data } = await api.get("/archive/search", { params });
      return data.data;
    },
    staleTime: 30_000,
  });
}

export function useArchiveItem(id: string) {
  return useQuery({
    queryKey: ["archive", "item", id],
    queryFn: async () => {
      const { data } = await api.get(`/archive/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useArchiveVersions(id: string) {
  return useQuery({
    queryKey: ["archive", "versions", id],
    queryFn: async () => {
      const { data } = await api.get(`/archive/${id}/versions`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useUploadArchiveItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post("/archive/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["archive"] });
    },
  });
}

export function useUpdateArchiveItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: {
      id: string;
      title_en?: string;
      title_bn?: string;
      description?: string;
      authors?: string[];
      tags?: string[];
      category?: string;
      access_tier?: string;
    }) => {
      const { data } = await api.patch(`/archive/${id}`, payload);
      return data.data;
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["archive", "item", id] });
      queryClient.invalidateQueries({ queryKey: ["archive", "search"] });
    },
  });
}

export function useUpdateArchiveStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await api.patch(`/archive/${id}/status`, { status });
      return data.data;
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["archive", "item", id] });
      queryClient.invalidateQueries({ queryKey: ["archive", "search"] });
    },
  });
}

export function useDownloadArchiveItem() {
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.get(`/archive/${id}/download`);
      return data.data.url as string;
    },
  });
}

export function useTags() {
  return useQuery({
    queryKey: ["archive", "tags"],
    queryFn: async () => {
      const { data } = await api.get("/archive/meta/tags");
      return data.data;
    },
    staleTime: 5 * 60_000,
  });
}
