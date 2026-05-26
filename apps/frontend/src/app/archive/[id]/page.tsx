"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Download, FileText, Lock, ArrowLeft, Clock, CheckCircle, XCircle } from "lucide-react";
import { useArchiveItem, useArchiveVersions, useDownloadArchiveItem, useRequestAccess } from "@/hooks/useArchive";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { formatDate, formatFileSize, getAccessTierBadge, getStatusBadge } from "@/lib/utils";
import toast from "react-hot-toast";

export default function ArchiveItemPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const itemId = params?.id ?? "";

  const { data: item, isLoading, error, refetch } = useArchiveItem(itemId);
  const { data: versions } = useArchiveVersions(itemId);
  const { mutateAsync: download, isPending: isDownloading } = useDownloadArchiveItem();
  const { mutateAsync: requestAccess, isPending: isSubmitting } = useRequestAccess();

  const [reason, setReason] = useState("");

  const handleDownload = async () => {
    try {
      const url = await download(itemId);
      window.open(url, "_blank");
    } catch {
      toast.error("Download failed or access denied");
    }
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error("Please enter a reason for requesting access");
      return;
    }
    try {
      await requestAccess({ id: itemId, reason: reason.trim() });
      toast.success("Access request submitted successfully!");
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit request");
    }
  };

  const apiError = error as any;
  const isForbidden = apiError?.response?.status === 403;
  const restrictedData = apiError?.response?.data?.data;

  // ─────────── 403 Forbidden: Restricted Access Screen ───────────
  if (isForbidden && restrictedData) {
    const statusText = restrictedData.request_status;

    return (
      <AppLayout>
        <div style={{ padding: "28px 32px", maxWidth: "800px", margin: "0 auto" }}>
          {/* Back button */}
          <button
            onClick={() => router.back()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              border: "none",
              background: "none",
              color: "#6b7280",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              marginBottom: 20,
            }}
          >
            <ArrowLeft size={14} /> Back to Archive
          </button>

          <div
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 16,
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)",
              overflow: "hidden",
            }}
          >
            {/* Red Alert Header Accent */}
            <div style={{ height: 6, background: "linear-gradient(90deg, #dc2626 0%, #ef4444 100%)" }} />

            <div style={{ padding: 32, textAlign: "center" }}>
              {/* Lock Visual Icon */}
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "#fef2f2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  border: "1px solid #fee2e2",
                }}
              >
                <Lock size={24} color="#dc2626" />
              </div>

              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "4px 10px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  background: "#fde8e8",
                  color: "#c81e1e",
                  marginBottom: 12,
                }}
              >
                Restricted Document
              </span>

              <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: "0 0 8px", lineHeight: 1.3 }}>
                {restrictedData.title_en}
              </h1>
              {restrictedData.title_bn && (
                <p style={{ fontSize: 15, color: "#4b5563", marginTop: 4, marginBottom: 8 }}>
                  {restrictedData.title_bn}
                </p>
              )}
              <p style={{ fontSize: 13, color: "#6b7280", margin: "0 auto 24px", maxWidth: 500 }}>
                This resource belongs to the institutional restricted archive tier. You do not have permissions to download or view this file directly.
              </p>

              {/* Status Logic */}
              {!statusText ? (
                <form
                  onSubmit={handleRequestAccess}
                  style={{
                    maxWidth: 500,
                    margin: "0 auto",
                    textAlign: "left",
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: 20,
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#374151",
                      marginBottom: 8,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Reason for requesting access
                  </label>
                  <textarea
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Provide a valid academic or institutional reason (e.g. Research thesis validation, project review justification)..."
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid #d1d5db",
                      fontSize: 13,
                      fontFamily: "inherit",
                      resize: "none",
                      outline: "none",
                      marginBottom: 16,
                      background: "#fff",
                      boxSizing: "border-box",
                    }}
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      width: "100%",
                      padding: "11px 16px",
                      borderRadius: 8,
                      border: "none",
                      background: "linear-gradient(160deg,rgba(30,40,60,0.9) 0%,rgba(10,15,25,1) 100%)",
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      textAlign: "center",
                      opacity: isSubmitting ? 0.7 : 1,
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    }}
                  >
                    {isSubmitting ? "Submitting Request..." : "Submit Access Request"}
                  </button>
                </form>
              ) : statusText === "pending" ? (
                <div
                  style={{
                    maxWidth: 500,
                    margin: "0 auto",
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    borderRadius: 12,
                    padding: "20px 24px",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    textAlign: "left",
                  }}
                >
                  <Clock size={36} color="#1d4ed8" style={{ flexShrink: 0 }} />
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: "#1e3a8a", margin: 0 }}>
                      Access Request Pending
                    </h4>
                    <p style={{ fontSize: 13, color: "#1e40af", margin: "4px 0 0", lineHeight: 1.4 }}>
                      Your access request has been sent to the Archivist and Administrator. You will receive an in-app notification once the status is reviewed.
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    maxWidth: 500,
                    margin: "0 auto",
                    background: "#fef2f2",
                    border: "1px solid #fca5a5",
                    borderRadius: 12,
                    padding: "20px 24px",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    textAlign: "left",
                  }}
                >
                  <XCircle size={36} color="#b91c1c" style={{ flexShrink: 0 }} />
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: "#7f1d1d", margin: 0 }}>
                      Access Request Denied
                    </h4>
                    <p style={{ fontSize: 13, color: "#991b1b", margin: "4px 0 0", lineHeight: 1.4 }}>
                      Your request to view this restricted document has been reviewed and declined. Please contact the archives administrator for details.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ─────────── Loading State ───────────
  if (isLoading) {
    return (
      <AppLayout>
        <div style={{ padding: "28px 32px", maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ height: 16, width: 120, background: "#f3f4f6", borderRadius: 4, marginBottom: 20 }} />
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24, height: 260 }} />
        </div>
      </AppLayout>
    );
  }

  // ─────────── Not Found Fallback ───────────
  if (!item) {
    return (
      <AppLayout>
        <div style={{ padding: "28px 32px", maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 15, color: "#6b7280" }}>Archive item not found.</p>
        </div>
      </AppLayout>
    );
  }

  const tier = getAccessTierBadge(item.access_tier);
  const status = getStatusBadge(item.status);

  // ─────────── Normal Details Render ───────────
  return (
    <AppLayout>
      <div style={{ padding: "28px 32px", maxWidth: "900px", margin: "0 auto" }}>
        
        {/* Back button */}
        <button
          onClick={() => router.back()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            border: "none",
            background: "none",
            color: "#6b7280",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: 20,
          }}
        >
          <ArrowLeft size={14} /> Back to Archive
        </button>

        {/* Detail Card */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 28,
            marginBottom: 24,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0, lineHeight: 1.3 }}>
                {item.title_en}
              </h1>
              {item.title_bn && (
                <p style={{ fontSize: 16, color: "#4b5563", marginTop: 6, margin: 0 }}>
                  {item.title_bn}
                </p>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider ${tier.color}`}
              >
                {tier.label}
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider ${status.color}`}
              >
                {status.label}
              </span>
            </div>
          </div>

          {item.description && (
            <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.6, margin: "0 0 20px" }}>
              {item.description}
            </p>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "14px 24px",
              fontSize: 13,
              borderTop: "1px solid #f3f4f6",
              paddingTop: 18,
              marginBottom: 24,
            }}
          >
            <div>
              <span style={{ color: "#9ca3af", fontWeight: 500 }}>Authors</span>
              <p style={{ margin: "4px 0 0", color: "#111827", fontWeight: 600 }}>
                {item.authors?.join(", ") || "No authors specified"}
              </p>
            </div>
            <div>
              <span style={{ color: "#9ca3af", fontWeight: 500 }}>Category</span>
              <p style={{ margin: "4px 0 0", color: "#111827", fontWeight: 600 }}>{item.category}</p>
            </div>
            <div>
              <span style={{ color: "#9ca3af", fontWeight: 500 }}>Language</span>
              <p style={{ margin: "4px 0 0", color: "#111827", fontWeight: 600, textTransform: "uppercase" }}>
                {item.language}
              </p>
            </div>
            <div>
              <span style={{ color: "#9ca3af", fontWeight: 500 }}>File Size</span>
              <p style={{ margin: "4px 0 0", color: "#111827", fontWeight: 600 }}>
                {formatFileSize(item.file_size)}
              </p>
            </div>
            <div>
              <span style={{ color: "#9ca3af", fontWeight: 500 }}>Uploaded Date</span>
              <p style={{ margin: "4px 0 0", color: "#111827", fontWeight: 600 }}>
                {formatDate(item.created_at)}
              </p>
            </div>
            <div>
              <span style={{ color: "#9ca3af", fontWeight: 500 }}>Last Updated</span>
              <p style={{ margin: "4px 0 0", color: "#111827", fontWeight: 600 }}>
                {formatDate(item.updated_at)}
              </p>
            </div>
          </div>

          <button
            onClick={handleDownload}
            disabled={item.status !== "published" || isDownloading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              border: "none",
              background: "linear-gradient(160deg,rgba(30,40,60,0.9) 0%,rgba(10,15,25,1) 100%)",
              color: "#fff",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              opacity: (item.status !== "published" || isDownloading) ? 0.6 : 1,
            }}
          >
            <Download size={14} />
            {isDownloading ? "Preparing File..." : "Download Document"}
          </button>
        </div>

        {/* Versions Card */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 24,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#111827", margin: "0 0 16px" }}>
            Revision History
          </h2>
          {!versions?.length ? (
            <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>No version history available.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {versions.map((version: { version_id: string; version_number: number; created_at: string }) => (
                <div
                  key={version.version_id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: 13,
                    borderBottom: "1px solid #f3f4f6",
                    paddingBottom: 10,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#374151", fontWeight: 600 }}>
                    <FileText size={14} color="#9ca3af" /> Version {version.version_number}
                  </div>
                  <span style={{ color: "#6b7280" }}>{formatDate(version.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </AppLayout>
  );
}
