import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { CatalogSearchParams } from "@dkp/shared";

export function useCatalogSearch(params: CatalogSearchParams) {
  return useQuery({
    queryKey: ["catalog", "search", params],
    queryFn: async () => {
      const { data } = await api.get("/library/catalog/search", { params });
      return data.data;
    },
    staleTime: 30_000,
  });
}

export function useCatalogItem(id: string) {
  return useQuery({
    queryKey: ["catalog", "item", id],
    queryFn: async () => {
      const { data } = await api.get(`/library/catalog/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useLibrarianDashboard() {
  return useQuery({
    queryKey: ["library", "dashboard"],
    queryFn: async () => {
      const { data } = await api.get("/library/dashboard");
      return data.data;
    },
    refetchInterval: 30_000,
  });
}

export function useIssueBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { catalog_id: string; member_id: string }) => {
      const { data } = await api.post("/library/issue", payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library", "dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
    },
  });
}

export function useReturnBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (transaction_id: string) => {
      const { data } = await api.post("/library/return", { transaction_id });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
    },
  });
}

export function useBorrowingHistory(memberId: string) {
  return useQuery({
    queryKey: ["library", "history", memberId],
    queryFn: async () => {
      const { data } = await api.get(`/library/member/${memberId}/history`);
      return data.data;
    },
    enabled: !!memberId,
  });
}

export function useWishlist() {
  return useQuery({
    queryKey: ["library", "wishlist"],
    queryFn: async () => {
      const { data } = await api.get("/library/wishlist");
      return data.data;
    },
  });
}

export function useAddToWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (catalog_id: string) => {
      const { data } = await api.post("/library/wishlist", { catalog_id });
      return data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["library", "wishlist"] }),
  });
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (catalog_id: string) => {
      await api.delete(`/library/wishlist/${catalog_id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["library", "wishlist"] }),
  });
}

export function usePlaceHold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (catalog_id: string) => {
      const { data } = await api.post("/library/holds", { catalog_id });
      return data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["library"] }),
  });
}

export function useMemberFines(memberId: string) {
  return useQuery({
    queryKey: ["library", "fines", memberId],
    queryFn: async () => {
      const { data } = await api.get(`/library/fines/${memberId}`);
      return data.data;
    },
    enabled: !!memberId,
  });
}

export function useOverdueItems() {
  return useQuery({
    queryKey: ["library", "overdue"],
    queryFn: async () => {
      const { data } = await api.get("/library/overdue");
      return data.data;
    },
  });
}

export function useWaiveFine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (fineId: string) => {
      const { data } = await api.patch(`/library/fines/${fineId}/waive`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
    },
  });
}

export function useAdjustFine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ fineId, amount, reason }: { fineId: string; amount: number; reason: string }) => {
      const { data } = await api.patch(`/library/fines/${fineId}/adjust`, { amount, reason });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
    },
  });
}

export function useCreateCatalogItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post("/library/catalog", payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
      queryClient.invalidateQueries({ queryKey: ["library", "dashboard"] });
    },
  });
}

export function useUpdateCatalogItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & Record<string, unknown>) => {
      const { data } = await api.put(`/library/catalog/${id}`, payload);
      return data.data;
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["catalog", "item", id] });
      queryClient.invalidateQueries({ queryKey: ["catalog", "search"] });
    },
  });
}

export function useDeleteCatalogItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/library/catalog/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
      queryClient.invalidateQueries({ queryKey: ["library", "dashboard"] });
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
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["showcase"] });
    },
  });
}

export function useUpdateResearchOutput() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & Record<string, unknown>) => {
      const { data } = await api.patch(`/research/${id}`, payload);
      return data.data;
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["research", "detail", id] });
      queryClient.invalidateQueries({ queryKey: ["research"] });
    },
  });
}
