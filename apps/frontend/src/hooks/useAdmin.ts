import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export interface AdminStats {
  totalDocuments: number;
  pendingReview: number;
  activeUsers: number;
  storagePercentage: number;
  recentDocuments: Array<{
    id: string;
    title: string;
    authors: string;
    department: string;
    status: string;
    lastModified: string;
    access: string;
    downloadCount: number;
  }>;
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const { data } = await api.get("/admin/stats");
      return data.data as AdminStats;
    },
    staleTime: 30_000,
    refetchInterval: 60_000, // Refetch every minute
  });
}

export function useCatalogDocuments(params?: { page?: number; limit?: number; status?: string; search?: string }) {
  return useQuery({
    queryKey: ["admin", "catalog", params],
    queryFn: async () => {
      const { data } = await api.get("/admin/catalog/documents", { params });
      return data.data;
    },
    staleTime: 30_000,
  });
}

export function useResearcherSubmissions(params?: { page?: number; limit?: number; status?: string; search?: string }) {
  return useQuery({
    queryKey: ["admin", "my-submissions", params],
    queryFn: async () => {
      const { data } = await api.get("/admin/my-submissions", { params });
      return data.data;
    },
    staleTime: 30_000,
  });
}

export function useArchiveDocuments(params?: { page?: number; limit?: number; status?: string; search?: string }) {
  return useQuery({
    queryKey: ["admin", "archive", params],
    queryFn: async () => {
      const { data } = await api.get("/admin/archive/documents", { params });
      return data.data;
    },
    staleTime: 30_000,
  });
}

export function useUpdateDocumentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ type, id, status }: { type: "catalog" | "archive"; id: string; status: string }) => {
      const endpoint = type === "catalog" ? `/admin/catalog/${id}/status` : `/admin/archive/${id}/status`;
      const { data } = await api.patch(endpoint, { status });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}

export function useToggleDocumentAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ type, id, access }: { type: "catalog" | "archive"; id: string; access: string }) => {
      const endpoint = type === "catalog" ? `/admin/catalog/${id}/access` : `/admin/archive/${id}/access`;
      const { data } = await api.patch(endpoint, { access });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ type, id }: { type: "catalog" | "archive"; id: string }) => {
      const endpoint = type === "catalog" ? `/admin/catalog/${id}` : `/admin/archive/${id}`;
      const { data } = await api.delete(endpoint);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}
