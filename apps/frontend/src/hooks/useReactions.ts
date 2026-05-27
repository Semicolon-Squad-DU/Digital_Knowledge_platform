import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export interface ReactionsPayload {
  counts: Record<string, number>;
  userReactions: string[];
}

export function useReactionsData(entityType: string, entityId: string) {
  return useQuery<ReactionsPayload>({
    queryKey: ["reactions", entityType, entityId],
    queryFn: async () => {
      const { data } = await api.get(`/reactions/${entityType}/${entityId}`);
      return data.data;
    },
    enabled: !!entityType && !!entityId,
  });
}

export function useToggleReaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      entityType: string;
      entityId: string;
      reactionType: string;
    }) => {
      const { data } = await api.post("/reactions/toggle", payload);
      return { ...payload, ...data.data };
    },
    onSuccess: (variables) => {
      queryClient.invalidateQueries({
        queryKey: ["reactions", variables.entityType, variables.entityId],
      });
    },
  });
}
