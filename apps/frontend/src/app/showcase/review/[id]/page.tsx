"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

export default function ShowcaseReviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const projectId = params?.id ?? "";
  const { user } = useAuthStore();
  const [comments, setComments] = useState("");

  const canReview = useMemo(() => user?.role === "researcher" || user?.role === "admin", [user?.role]);

  const { data: project, isLoading } = useQuery({
    queryKey: ["showcase", "review", projectId],
    queryFn: async () => {
      const { data } = await api.get(`/showcase/${projectId}`);
      return data.data;
    },
    enabled: !!projectId,
  });

  const reviewMutation = useMutation({
    mutationFn: async (action: "approve" | "request_changes") => {
      const { data } = await api.patch(`/showcase/${projectId}/review`, { action, comments: comments.trim() || undefined });
      return data.data;
    },
    onSuccess: () => {
      toast.success("Review submitted");
      router.push(`/showcase/${projectId}`);
    },
    onError: () => {
      toast.error("Could not submit review");
    },
  });

  if (isLoading) {
    return <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-sm text-slate-500">Loading project...</div>;
  }

  if (!project) {
    return <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-sm text-slate-500">Project not found.</div>;
  }

  if (!canReview) {
    return <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-sm text-slate-500">Only researchers or admins can review projects.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Review Project</h1>
        <p className="text-sm text-slate-600 mb-4">{project.title}</p>

        <p className="text-sm text-slate-700 mb-4">{project.abstract}</p>

        <label className="block text-sm font-medium text-slate-800 mb-2">Comments (optional)</label>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={5}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Add feedback for the student"
        />

        <div className="flex items-center gap-2 mt-4">
          <Button onClick={() => reviewMutation.mutate("approve")} loading={reviewMutation.isPending}>
            Approve
          </Button>
          <Button variant="outline" onClick={() => reviewMutation.mutate("request_changes")} loading={reviewMutation.isPending}>
            Request Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
