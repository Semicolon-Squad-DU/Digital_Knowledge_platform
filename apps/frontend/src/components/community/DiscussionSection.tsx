"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import {
  useCommentsList,
  usePostComment,
  useDeleteComment,
  CommentData,
} from "@/hooks/useComments";
import { useReactionsData, useToggleReaction } from "@/hooks/useReactions";
import { MessageSquare, Trash2, CornerDownRight, ThumbsUp, Heart, Lightbulb, Sparkles, Send } from "lucide-react";
import toast from "react-hot-toast";

interface DiscussionSectionProps {
  entityType: string;
  entityId: string;
}

export function DiscussionSection({ entityType, entityId }: DiscussionSectionProps) {
  const { user } = useAuthStore();
  const { data: comments = [], isLoading: commentsLoading } = useCommentsList(entityType, entityId);
  const { data: reactions, isLoading: reactionsLoading } = useReactionsData(entityType, entityId);

  const { mutateAsync: postComment } = usePostComment();
  const { mutateAsync: deleteComment } = useDeleteComment();
  const { mutateAsync: toggleReaction } = useToggleReaction();

  const [commentText, setCommentText] = useState("");
  const [replyTarget, setReplyTarget] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const handlePostMainComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to post a comment");
      return;
    }
    if (!commentText.trim()) return;

    try {
      await postComment({
        entityType,
        entityId,
        content: commentText,
      });
      setCommentText("");
      toast.success("Comment posted!");
    } catch {
      toast.error("Failed to post comment");
    }
  };

  const handlePostReply = async (parentId: string) => {
    if (!user) {
      toast.error("Please sign in to reply");
      return;
    }
    if (!replyText.trim()) return;

    try {
      await postComment({
        entityType,
        entityId,
        parentId,
        content: replyText,
      });
      setReplyText("");
      setReplyTarget(null);
      toast.success("Reply posted!");
    } catch {
      toast.error("Failed to post reply");
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      await deleteComment({ commentId, entityType, entityId });
      toast.success("Comment deleted");
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  const handleReactionToggle = async (reactionType: string) => {
    if (!user) {
      toast.error("Please sign in to react");
      return;
    }
    try {
      await toggleReaction({
        entityType,
        entityId,
        reactionType,
      });
    } catch {
      toast.error("Failed to toggle reaction");
    }
  };

  // Group comments into root comments and nested replies
  const rootComments = comments.filter((c) => !c.parent_id);
  const getReplies = (parentId: string) => comments.filter((c) => c.parent_id === parentId);

  const reactionOptions = [
    { type: "like", icon: ThumbsUp, label: "Like", emoji: "👍" },
    { type: "love", icon: Heart, label: "Love", emoji: "❤️" },
    { type: "clap", icon: Sparkles, label: "Clap", emoji: "👏" },
    { type: "insightful", icon: Lightbulb, label: "Insightful", emoji: "💡" },
  ];

  return (
    <div style={{ marginTop: "40px", borderTop: "1px solid #e5e7eb", paddingTop: "32px", fontFamily: "'Inter', sans-serif" }}>
      
      {/* ── REACTIONS OVERVIEW ── */}
      <div style={{ marginBottom: "28px" }}>
        <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#111827", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Reactions
        </h4>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {reactionOptions.map(({ type, emoji, label }) => {
            const count = reactions?.counts?.[type] ?? 0;
            const hasReacted = reactions?.userReactions?.includes(type);

            return (
              <button
                key={type}
                onClick={() => handleReactionToggle(type)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  borderRadius: "100px",
                  fontSize: "13px",
                  fontWeight: 600,
                  border: "1px solid",
                  borderColor: hasReacted ? "var(--avatar-theme-color, #2563eb)" : "#d1d5db",
                  background: hasReacted ? "rgba(37, 99, 235, 0.05)" : "#ffffff",
                  color: hasReacted ? "var(--avatar-theme-color, #2563eb)" : "#374151",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                <span>{emoji}</span>
                <span>{label}</span>
                <span style={{
                  padding: "1px 6px",
                  background: hasReacted ? "var(--avatar-theme-color, #2563eb)" : "#f3f4f6",
                  color: hasReacted ? "#ffffff" : "#6b7280",
                  borderRadius: "100px",
                  fontSize: "11px",
                  fontWeight: 700
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── COMMENTS HEADER ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "20px" }}>
        <MessageSquare size={18} color="#374151" />
        <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#111827", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
          Discussion ({comments.length})
        </h4>
      </div>

      {/* ── POST MAIN COMMENT ── */}
      {user ? (
        <form onSubmit={handlePostMainComment} style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: "32px" }}>
          <textarea
            placeholder="Post a comment or share your thoughts..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={3}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              fontSize: "13px",
              fontFamily: "inherit",
              resize: "none",
              outline: "none",
              boxSizing: "border-box"
            }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 18px",
                fontSize: "13px",
                fontWeight: 600,
                color: "#ffffff",
                background: "var(--theme-gradient-160)",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
              }}
            >
              <Send size={13} />
              Post Comment
            </button>
          </div>
        </form>
      ) : (
        <div style={{ padding: "16px", background: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb", marginBottom: "32px", textAlign: "center" }}>
          <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>
            Please <a href="/login" style={{ color: "var(--avatar-theme-color, #2563eb)", fontWeight: 600, textDecoration: "underline" }}>sign in</a> to join the conversation.
          </p>
        </div>
      )}

      {/* ── COMMENTS TREE ── */}
      {commentsLoading ? (
        <p style={{ fontSize: "13px", color: "#6b7280" }}>Loading comments...</p>
      ) : comments.length === 0 ? (
        <p style={{ fontSize: "13px", color: "#9ca3af", fontStyle: "italic" }}>No comments yet. Start the discussion!</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {rootComments.map((comment) => {
            const replies = getReplies(comment.comment_id);
            const isReplying = replyTarget === comment.comment_id;
            const canDelete = user && (user.user_id === comment.user_id || user.role === "admin");

            return (
              <div key={comment.comment_id} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                
                {/* ROOT COMMENT */}
                <div style={{ padding: "14px 16px", background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}>{comment.user_name}</span>
                      <span style={{
                        fontSize: "10px",
                        marginLeft: 8,
                        padding: "1px 6px",
                        borderRadius: "100px",
                        background: comment.user_role === "admin" ? "#fee2e2" : "#f3f4f6",
                        color: comment.user_role === "admin" ? "#ef4444" : "#6b7280",
                        fontWeight: 600,
                        textTransform: "uppercase"
                      }}>
                        {comment.user_role}
                      </span>
                    </div>
                    <span style={{ fontSize: "11px", color: "#9ca3af" }}>
                      {new Date(comment.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <p style={{ fontSize: "13px", color: "#374151", margin: "0 0 10px", lineHeight: 1.5 }}>
                    {comment.content}
                  </p>

                  <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                    {user && (
                      <button
                        onClick={() => {
                          setReplyTarget(isReplying ? null : comment.comment_id);
                          setReplyText("");
                        }}
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "var(--avatar-theme-color, #2563eb)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0
                        }}
                      >
                        Reply
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(comment.comment_id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "3px",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#ef4444",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0
                        }}
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {/* NESTED REPLIES */}
                {replies.length > 0 && (
                  <div style={{ marginLeft: "28px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    {replies.map((reply) => {
                      const canDeleteReply = user && (user.user_id === reply.user_id || user.role === "admin");

                      return (
                        <div key={reply.comment_id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <CornerDownRight size={14} color="#9ca3af" style={{ marginTop: 12, flexShrink: 0 }} />
                          <div style={{
                            flex: 1,
                            padding: "12px 14px",
                            background: "#f9fafb",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.01)"
                          }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                              <div>
                                <span style={{ fontSize: "12px", fontWeight: 700, color: "#111827" }}>{reply.user_name}</span>
                                <span style={{
                                  fontSize: "9px",
                                  marginLeft: 6,
                                  padding: "1px 5px",
                                  borderRadius: "100px",
                                  background: reply.user_role === "admin" ? "#fee2e2" : "#f3f4f6",
                                  color: reply.user_role === "admin" ? "#ef4444" : "#6b7280",
                                  fontWeight: 600,
                                  textTransform: "uppercase"
                                }}>
                                  {reply.user_role}
                                </span>
                              </div>
                              <span style={{ fontSize: "11px", color: "#9ca3af" }}>
                                {new Date(reply.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>

                            <p style={{ fontSize: "12.5px", color: "#374151", margin: "0 0 8px", lineHeight: 1.45 }}>
                              {reply.content}
                            </p>

                            {canDeleteReply && (
                              <button
                                onClick={() => handleDelete(reply.comment_id)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "3px",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  color: "#ef4444",
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  padding: 0
                                }}
                              >
                                <Trash2 size={11} />
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* REPLY EDITOR */}
                {isReplying && (
                  <div style={{ marginLeft: "28px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <CornerDownRight size={14} color="#9ca3af" style={{ marginTop: 12, flexShrink: 0 }} />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                      <textarea
                        placeholder={`Reply to ${comment.user_name}...`}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={2}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "6px",
                          border: "1px solid #d1d5db",
                          fontSize: "12.5px",
                          fontFamily: "inherit",
                          resize: "none",
                          outline: "none",
                          boxSizing: "border-box"
                        }}
                      />
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                        <button
                          onClick={() => setReplyTarget(null)}
                          style={{
                            padding: "5px 12px",
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#4b5563",
                            background: "#ffffff",
                            border: "1px solid #d1d5db",
                            borderRadius: "4px",
                            cursor: "pointer"
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handlePostReply(comment.comment_id)}
                          style={{
                            padding: "5px 12px",
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#ffffff",
                            background: "var(--theme-gradient-160)",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer"
                          }}
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
