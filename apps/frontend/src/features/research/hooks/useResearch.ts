import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { ResearchOutput, CitationExport } from "@dkp/shared";

export interface ResearchSearchParams {
  q?: string;
  author?: string;
  keyword?: string;
  year?: number;
  output_type?: string;
  lab_id?: string;
  page?: number;
  limit?: number;
}

export function useResearchList(params: ResearchSearchParams) {
  return useQuery({
    queryKey: ["research", "list", params],
    queryFn: async () => {
      const { data } = await api.get("/research", { params });
      return data.data;
    },
    staleTime: 30_000,
  });
}

export function useResearchItem(id: string) {
  return useQuery({
    queryKey: ["research", "item", id],
    queryFn: async () => {
      const { data } = await api.get(`/research/${id}`);
      return data.data as ResearchOutput;
    },
    enabled: !!id,
  });
}

export function useResearchCitation(id: string) {
  return useQuery({
    queryKey: ["research", "citation", id],
    queryFn: async () => {
      const { data } = await api.get(`/research/${id}/cite`);
      return data.data as CitationExport;
    },
    enabled: !!id,
    staleTime: Infinity, // citations don't change
  });
}

export function useLabs() {
  return useQuery({
    queryKey: ["research", "labs"],
    queryFn: async () => {
      const { data } = await api.get("/research/meta/labs");
      return data.data;
    },
    staleTime: 5 * 60_000,
  });
}

export function useSubmitResearchOutput() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post("/research", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.data as ResearchOutput;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["research", "list"] });
    },
  });
}

export function useUpdateResearchOutput() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<ResearchOutput> }) => {
      const { data } = await api.patch(`/research/${id}`, payload);
      return data.data as ResearchOutput;
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["research", "item", id] });
      queryClient.invalidateQueries({ queryKey: ["research", "list"] });
    },
  });
}
