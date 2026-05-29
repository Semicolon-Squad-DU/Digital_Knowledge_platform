import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export interface AdminStats {
  totalUsers: number;
  archiveCount: number;
  catalogCount: number;
  showcaseCount: number;
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
    staleTime: 0, // always fetch fresh counts from live database
    refetchInterval: 15_000, // Refetch every 15 seconds
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

export function useAdminUsers(params?: { search?: string; role?: string; status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: async () => {
      const { data } = await api.get("/admin/users", { params });
      return data.data;
    },
    staleTime: 30_000,
  });
}

export function useCreateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (user: any) => {
      const { data } = await api.post("/admin/users", user);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...user }: { id: string; name?: string; email?: string; role?: string; department?: string; membership_status?: string }) => {
      const { data } = await api.patch(`/admin/users/${id}`, user);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, mode }: { id: string; mode: "hard_delete" | "anonymize" }) => {
      const { data } = await api.delete(`/admin/users/${id}`, { params: { mode } });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useAdminConfigs() {
  return useQuery({
    queryKey: ["admin", "configs"],
    queryFn: async () => {
      const { data } = await api.get("/admin/configs");
      return data.data;
    },
    staleTime: 60_000,
  });
}

export function useUpdateAdminConfigs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (configs: Record<string, string>) => {
      const { data } = await api.post("/admin/configs", { configs });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "configs"] });
    },
  });
}

export function useAdminAuditLogs(params?: { search?: string; action?: string; entityType?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["admin", "audit-logs", params],
    queryFn: async () => {
      const { data } = await api.get("/admin/audit-logs", { params });
      return data.data;
    },
    staleTime: 30_000,
  });
}

export function useAdminHealth() {
  return useQuery({
    queryKey: ["admin", "health"],
    queryFn: async () => {
      const { data } = await api.get("/admin/health");
      return data.data;
    },
    staleTime: 10_000, // short cache for high-accuracy live health status
    refetchInterval: 15_000, // Poll health status every 15 seconds
  });
}

