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

export function useOverdueTransactions() {
  return useQuery({
    queryKey: ["library", "overdue"],
    queryFn: async () => {
      const { data } = await api.get("/library/overdue");
      return data.data;
    },
  });
}

export function useAdjustFine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { fine_id: string; amount: number; reason: string }) => {
      const { data } = await api.patch(`/library/fines/${payload.fine_id}/adjust`, {
        amount: payload.amount,
        reason: payload.reason,
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library", "overdue"] });
      queryClient.invalidateQueries({ queryKey: ["library", "fines"] });
    },
  });
}

export function useWaiveFine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (fine_id: string) => {
      const { data } = await api.patch(`/library/fines/${fine_id}/waive`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library", "overdue"] });
      queryClient.invalidateQueries({ queryKey: ["library", "fines"] });
    },
  });
}

export function useCreateCatalogItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      title: string;
      isbn?: string;
      authors?: string[];
      publisher?: string;
      edition?: string;
      year?: number;
      category?: string;
      total_copies: number;
      shelf_location?: string;
      description?: string;
    }) => {
      const { data } = await api.post("/library/catalog", payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
      queryClient.invalidateQueries({ queryKey: ["library"] });
    },
  });
}

export function useUpdateCatalogItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      catalog_id: string;
      title?: string;
      isbn?: string;
      authors?: string[];
      publisher?: string;
      edition?: string;
      year?: number;
      category?: string;
      total_copies?: number;
      shelf_location?: string;
      description?: string;
    }) => {
      const { catalog_id, ...data } = payload;
      const response = await api.put(`/library/catalog/${catalog_id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
      queryClient.invalidateQueries({ queryKey: ["library"] });
    },
  });
}

export function useDeleteCatalogItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (catalog_id: string) => {
      const { data } = await api.delete(`/library/catalog/${catalog_id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
      queryClient.invalidateQueries({ queryKey: ["library"] });
    },
  });
}


