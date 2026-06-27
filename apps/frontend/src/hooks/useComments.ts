import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export interface CommentData {
  comment_id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  user_name: string;
  user_role: string;
}

export function useCommentsList(entityType: string, entityId: string) {
  return useQuery<CommentData[]>({
    queryKey: ["comments", entityType, entityId],
    queryFn: async () => {
      const { data } = await api.get(`/comments/${entityType}/${entityId}`);
      return data.data;
    },
    enabled: !!entityType && !!entityId,
  });
}

export function usePostComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      entityType: string;
      entityId: string;
      parentId?: string | null;
      content: string;
    }) => {
      const { data } = await api.post("/comments", payload);
      return data.data as CommentData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", data.entity_type, data.entity_id],
      });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      commentId,
      entityType,
      entityId,
    }: {
      commentId: string;
      entityType: string;
      entityId: string;
    }) => {
      await api.delete(`/comments/${commentId}`);
      return { entityType, entityId };
    },
    onSuccess: (variables) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.entityType, variables.entityId],
      });
    },
  });
}

export function useModerateComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      commentId,
      entityType,
      entityId,
      isFlagged,
      isHidden,
    }: {
      commentId: string;
      entityType: string;
      entityId: string;
      isFlagged?: boolean;
      isHidden?: boolean;
    }) => {
      const { data } = await api.patch(`/comments/${commentId}/moderate`, { isFlagged, isHidden });
      return { data: data.data, entityType, entityId };
    },
    onSuccess: (variables) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.entityType, variables.entityId],
      });
    },
  });
}

