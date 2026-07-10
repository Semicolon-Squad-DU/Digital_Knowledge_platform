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
    mutationFn: async (payload: { catalog_id?: string; barcode?: string; member_id: string }) => {
      const { data } = await api.post("/library/issue", payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library", "dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
    },
  });
}

/** Resolves a scanned/typed barcode to a catalog item — used for scan-confirmation UX. */
export function useCatalogLookupByBarcode() {
  return useMutation({
    mutationFn: async (barcode: string) => {
      const { data } = await api.get(`/library/catalog/lookup/${encodeURIComponent(barcode)}`);
      return data.data as { catalog_id: string; title: string; authors: string[]; available_copies: number; barcode: string };
    },
  });
}

export function useReturnBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { transaction_id?: string; barcode?: string; member_id?: string }) => {
      const { data } = await api.post("/library/return", payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
    },
  });
}

export function useRenewBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (transaction_id: string) => {
      const { data } = await api.post("/library/renew", { transaction_id });
      return data.data as { transaction: unknown; renewals_left: number };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
    },
  });
}

export interface CirculationReportRow {
  transaction_id: string;
  title: string;
  isbn: string | null;
  member_name: string;
  member_email: string;
  issue_date: string;
  due_date: string;
  return_date: string | null;
  status: string;
  fine_amount: string | number;
  renewal_count: number;
}

export interface CirculationReport {
  summary: {
    total_issued: number;
    total_returned: number;
    total_overdue: number;
    total_fines: number;
    fines_collected: number;
    fines_pending: number;
  };
  transactions: CirculationReportRow[];
}

export function useCirculationReport(params: { from?: string; to?: string; status?: string }, enabled: boolean) {
  return useQuery({
    queryKey: ["library", "reports", "circulation", params],
    queryFn: async () => {
      const { data } = await api.get("/library/reports/circulation", { params });
      return data.data as CirculationReport;
    },
    enabled,
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

export function useMemberHolds(memberId: string) {
  return useQuery({
    queryKey: ["library", "holds", memberId],
    queryFn: async () => {
      const { data } = await api.get(`/library/member/${memberId}/holds`);
      return data.data;
    },
    enabled: !!memberId,
  });
}

export function useWishlist(enabled: boolean = true) {
  return useQuery({
    queryKey: ["library", "wishlist"],
    queryFn: async () => {
      const { data } = await api.get("/library/wishlist");
      return data.data;
    },
    enabled,
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

export function useCancelHold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (holdId: string) => {
      const { data } = await api.delete(`/library/holds/${holdId}`);
      return data;
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

export function useHoldsPending() {
  return useQuery({
    queryKey: ["library", "holds", "pending"],
    queryFn: async () => {
      const { data } = await api.get("/library/holds/pending");
      return data.data;
    },
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

export function useMarkFinePaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (fine_id: string) => {
      const { data } = await api.patch(`/library/fines/${fine_id}/pay`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library", "overdue"] });
      queryClient.invalidateQueries({ queryKey: ["library", "fines"] });
    },
  });
}

export function useNotifyOverdue() {
  return useMutation({
    mutationFn: async (transaction_id: string) => {
      const { data } = await api.post(`/library/overdue/${transaction_id}/notify`);
      return data;
    },
  });
}

export function useCreateCatalogItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: FormData | {
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
      barcode?: string;
    }) => {
      const isFormData = payload instanceof FormData;
      const { data } = await api.post("/library/catalog", payload, {
        headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
      });
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
      barcode?: string;
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

export interface CatalogImportRow {
  title: string;
  isbn?: string;
  authors: string[];
  publisher?: string;
  edition?: string;
  year?: number;
  category?: string;
  total_copies: number;
  shelf_location?: string;
  description?: string;
  barcode?: string;
}

export interface CatalogImportRowResult {
  row_number: number;
  data: CatalogImportRow | null;
  status: "valid" | "invalid" | "duplicate";
  errors: string[];
}

export function useImportCatalogPreview() {
  return useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/library/catalog/import/preview", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.data as {
        summary: { total: number; valid: number; duplicate: number; invalid: number };
        rows: CatalogImportRowResult[];
      };
    },
  });
}

export function useImportCatalogCommit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rows: CatalogImportRow[]) => {
      const { data } = await api.post("/library/catalog/import/commit", { rows });
      return data.data as { imported: number; failed: number; failures: { title: string; error: string }[] };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
      queryClient.invalidateQueries({ queryKey: ["library"] });
    },
  });
}

/** Downloads the full catalog as a CSV or XLSX file, streamed directly from the backend. */
export function useExportCatalog() {
  return useMutation({
    mutationFn: async (format: "csv" | "xlsx") => {
      const { data } = await api.get("/library/catalog/export", {
        params: { format },
        responseType: "blob",
      });
      const blob = new Blob([data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dkp-catalog-${new Date().toISOString().slice(0, 10)}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
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


