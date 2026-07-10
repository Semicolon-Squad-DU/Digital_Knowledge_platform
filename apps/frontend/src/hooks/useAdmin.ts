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

export function useCatalogDocuments(params?: { page?: number; limit?: number; status?: string; search?: string }, enabled = true) {
  return useQuery({
    queryKey: ["admin", "catalog", params],
    queryFn: async () => {
      const { data } = await api.get("/admin/catalog/documents", { params });
      return data.data;
    },
    staleTime: 30_000,
    enabled,
  });
}

export function useResearcherSubmissions(params?: { page?: number; limit?: number; status?: string; search?: string }, enabled = true) {
  return useQuery({
    queryKey: ["admin", "my-submissions", params],
    queryFn: async () => {
      const { data } = await api.get("/admin/my-submissions", { params });
      return data.data;
    },
    staleTime: 30_000,
    enabled,
  });
}

export function useArchiveDocuments(params?: { page?: number; limit?: number; status?: string; search?: string }, enabled = true) {
  return useQuery({
    queryKey: ["admin", "archive", params],
    queryFn: async () => {
      const { data } = await api.get("/admin/archive/documents", { params });
      return data.data;
    },
    staleTime: 30_000,
    enabled,
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

export function useApproveUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, approved, reason }: { id: string; approved: boolean; reason?: string }) => {
      const { data } = await api.post(`/admin/users/${id}/approve`, { approved, reason });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
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

export interface BackupRecord {
  backup_id: string;
  filename: string;
  s3_key: string | null;
  size_bytes: number | null;
  status: "running" | "completed" | "failed";
  triggered_by: "scheduled" | "manual";
  triggered_by_user: string | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export function useBackups() {
  return useQuery({
    queryKey: ["admin", "backups"],
    queryFn: async () => {
      const { data } = await api.get("/admin/backups");
      return data.data as BackupRecord[];
    },
    staleTime: 5_000,
    refetchInterval: (query) => (query.state.data?.some((b) => b.status === "running") ? 3_000 : false),
  });
}

export function useGenerateBackup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/admin/backups/generate");
      return data.data as BackupRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "backups"] });
    },
  });
}

export function useDownloadBackup() {
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.get(`/admin/backups/${id}/download`);
      return data.data.url as string;
    },
  });
}

export function useRestoreBackup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, confirmFilename }: { id: string; confirmFilename: string }) => {
      const { data } = await api.post(`/admin/backups/${id}/restore`, { confirmFilename });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "backups"] });
    },
  });
}

export function useBackupSchedule() {
  return useQuery({
    queryKey: ["admin", "backups", "schedule"],
    queryFn: async () => {
      const { data } = await api.get("/admin/backups/schedule");
      return data.data as { cronExpression: string; enabled: boolean };
    },
    staleTime: 30_000,
  });
}

export function useUpdateBackupSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (schedule: { cronExpression: string; enabled: boolean }) => {
      const { data } = await api.put("/admin/backups/schedule", schedule);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "backups", "schedule"] });
    },
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

export interface Announcement {
  announcement_id: string;
  title: string;
  body: string;
  target_role: string | null;
  created_at: string;
  created_by_name: string | null;
}

export function useAnnouncements() {
  return useQuery({
    queryKey: ["admin", "announcements"],
    queryFn: async () => {
      const { data } = await api.get("/notifications/announcements");
      return data.data as Announcement[];
    },
    staleTime: 15_000,
  });
}

export function useBroadcastAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { title: string; body: string; target_role?: string }) => {
      const { data } = await api.post("/notifications/announcements", payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "announcements"] });
    },
  });
}

