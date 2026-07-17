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

export interface AuthorSummary {
  user_id: string;
  name: string;
  department?: string;
  avatar_url?: string;
  output_count: string;
  latest_publication: string | null;
}

export interface AuthorProfile {
  user_id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  bio?: string;
  avatar_url?: string;
  created_at: string;
  publications: ResearchOutput[];
  labs: { lab_id: string; name: string; role: string }[];
  head_of_labs: { lab_id: string; name: string }[];
}

export function useResearchAuthors() {
  return useQuery({
    queryKey: ["research", "authors"],
    queryFn: async () => {
      const { data } = await api.get("/research/authors");
      return data.data as AuthorSummary[];
    },
    staleTime: 60_000,
  });
}

export function useResearchAuthor(id: string) {
  return useQuery({
    queryKey: ["research", "authors", id],
    queryFn: async () => {
      const { data } = await api.get(`/research/authors/${id}`);
      return data.data as AuthorProfile;
    },
    enabled: !!id,
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

export function useRetractResearchOutput() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/research/${id}/retract`);
      return data.data as ResearchOutput;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["research", "item", id] });
      queryClient.invalidateQueries({ queryKey: ["research", "list"] });
    },
  });
}
