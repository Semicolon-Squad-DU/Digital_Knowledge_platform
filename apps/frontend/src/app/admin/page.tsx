"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText, RefreshCw, Pencil, Trash2, Filter, ChevronLeft, ChevronRight,
  Users, HardDrive, AlertCircle, Search, BookOpen, Lock, Check, X,
  ShieldCheck, Settings, Database, Bell, Activity, UserCog, Eye,
  Download, UserCheck, Ban, RotateCcw, LayoutDashboard,
  ClipboardList, Server, Zap, Mail, Slack, Calendar,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { useAdminStats, useCatalogDocuments, useResearcherSubmissions, useArchiveDocuments } from "@/hooks/useAdmin";
import { useBorrowingHistory, useMemberHolds, useMemberFines } from "@/hooks/useLibrary";
import { usePendingAccessRequests, useReviewAccessRequest } from "@/hooks/useArchive";
import { AppLayout } from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/Skeleton";
import toast from "react-hot-toast";

// ── Types ─────────────────────────────────────────────────────────────────────
type AdminTab = "overview" | "users" | "audit" | "config" | "backups" | "alerts";

// ── Status pill map ───────────────────────────────────────────────────────────
const PILL: Record<string, { bg: string; color: string }> = {
  published:    { bg: "#e6f4ea", color: "#1e7e34" },
  active:       { bg: "#e6f4ea", color: "#1e7e34" },
  approved:     { bg: "#e6f4ea", color: "#1e7e34" },
  pending:      { bg: "#e8f0fe", color: "#1a56db" },
  pending_review:{ bg: "#e8f0fe", color: "#1a56db" },
  review:       { bg: "#e8f0fe", color: "#1a56db" },
  suspended:    { bg: "#fde8e8", color: "#c81e1e" },
  overdue:      { bg: "#fde8e8", color: "#c81e1e" },
  inactive:     { bg: "#f3f4f6", color: "#6b7280" },
  draft:        { bg: "#f3f4f6", color: "#6b7280" },
  returned:     { bg: "#f3f4f6", color: "#6b7280" },
};

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  admin:          { bg: "#fef3c7", color: "#92400e" },
  librarian:      { bg: "#ede9fe", color: "#5b21b6" },
  archivist:      { bg: "#dbeafe", color: "#1e40af" },
  researcher:     { bg: "#d1fae5", color: "#065f46" },
  student_author: { bg: "#fce7f3", color: "#9d174d" },
  member:         { bg: "#f0f9ff", color: "#0369a1" },
  guest:          { bg: "#f3f4f6", color: "#6b7280" },
};

const ACTION_COLORS: Record<string, { bg: string; color: string }> = {
  CREATE:        { bg: "#d1fae5", color: "#065f46" },
  UPDATE:        { bg: "#dbeafe", color: "#1e40af" },
  DELETE:        { bg: "#fde8e8", color: "#c81e1e" },
  ACCESS:        { bg: "#f0f9ff", color: "#0369a1" },
  LOGIN:         { bg: "#ede9fe", color: "#5b21b6" },
  LOGOUT:        { bg: "#f3f4f6", color: "#6b7280" },
  DOWNLOAD:      { bg: "#fef3c7", color: "#92400e" },
  STATUS_CHANGE: { bg: "#fce7f3", color: "#9d174d" },
};

// ── Mock data for UI preview ──────────────────────────────────────────────────
const MOCK_USERS = [
  { user_id: "u1", name: "Arif Rahman", email: "arif@dkp.edu", role: "admin", department: "CSE", membership_status: "active", created_at: "2024-01-15" },
  { user_id: "u2", name: "Nadia Islam", email: "nadia@dkp.edu", role: "researcher", department: "EEE", membership_status: "active", created_at: "2024-02-20" },
  { user_id: "u3", name: "Karim Hossain", email: "karim@dkp.edu", role: "student_author", department: "IIT", membership_status: "suspended", created_at: "2024-03-10" },
  { user_id: "u4", name: "Fatema Begum", email: "fatema@dkp.edu", role: "librarian", department: "GEB", membership_status: "active", created_at: "2024-01-28" },
  { user_id: "u5", name: "Rahim Uddin", email: "rahim@dkp.edu", role: "member", department: "PHR", membership_status: "inactive", created_at: "2024-04-05" },
  { user_id: "u6", name: "Sumaiya Khan", email: "sumaiya@dkp.edu", role: "archivist", department: "NE", membership_status: "active", created_at: "2024-02-14" },
];

const MOCK_AUDIT = [
  { log_id: "l1", user_id: "u1", user_name: "Arif Rahman", action: "LOGIN", entity_type: "session", entity_id: "s1", details: { ip: "192.168.1.1" }, timestamp: "2026-05-28T09:12:00Z" },
  { log_id: "l2", user_id: "u2", user_name: "Nadia Islam", action: "CREATE", entity_type: "research_output", entity_id: "r1", details: { title: "ML in Healthcare" }, timestamp: "2026-05-28T08:45:00Z" },
  { log_id: "l3", user_id: "u1", user_name: "Arif Rahman", action: "UPDATE", entity_type: "user", entity_id: "u3", details: { field: "role", from: "member", to: "student_author" }, timestamp: "2026-05-27T16:30:00Z" },
  { log_id: "l4", user_id: "u4", user_name: "Fatema Begum", action: "STATUS_CHANGE", entity_type: "catalog_item", entity_id: "c1", details: { from: "draft", to: "published" }, timestamp: "2026-05-27T14:20:00Z" },
  { log_id: "l5", user_id: "u3", user_name: "Karim Hossain", action: "ACCESS", entity_type: "archive_item", entity_id: "a1", details: { access_tier: "restricted" }, timestamp: "2026-05-27T11:05:00Z" },
  { log_id: "l6", user_id: "u1", user_name: "Arif Rahman", action: "DELETE", entity_type: "user", entity_id: "u7", details: { mode: "anonymize" }, timestamp: "2026-05-26T17:00:00Z" },
];

const MOCK_BACKUPS = [
  { backup_id: "b1", filename: "dkp_backup_2026-05-28_09-00.sql.gz", size_bytes: 52428800, created_at: "2026-05-28T09:00:00Z", status: "completed" },
  { backup_id: "b2", filename: "dkp_backup_2026-05-27_09-00.sql.gz", size_bytes: 51380224, created_at: "2026-05-27T09:00:00Z", status: "completed" },
  { backup_id: "b3", filename: "dkp_backup_2026-05-26_09-00.sql.gz", size_bytes: 50331648, created_at: "2026-05-26T09:00:00Z", status: "completed" },
];

const MOCK_ALERTS = [
  { id: "a1", type: "error_spike", title: "Error Rate Spike Detected", message: "5xx error rate exceeded 10/min threshold. Peak: 23 errors/min at 08:42 UTC.", timestamp: "2026-05-28T08:42:00Z", read: false },
  { id: "a2", type: "downtime", title: "Service Downtime Detected", message: "Health endpoint returned 503 for 3 consecutive polls (180s downtime).", timestamp: "2026-05-27T22:15:00Z", read: false },
  { id: "a3", type: "info", title: "Backup Completed Successfully", message: "Scheduled backup dkp_backup_2026-05-28_09-00.sql.gz uploaded to S3.", timestamp: "2026-05-28T09:01:00Z", read: true },
];

const MOCK_CONFIG = [
  { key: "session_timeout_minutes", value: "15", description: "JWT access token expiry in minutes" },
  { key: "password_min_length", value: "8", description: "Minimum password character length" },
  { key: "password_require_special_char", value: "true", description: "Require at least one special character" },
  { key: "max_login_attempts", value: "5", description: "Max failed login attempts before lockout" },
  { key: "maintenance_mode", value: "false", description: "Put platform in read-only maintenance mode" },
  { key: "backup_cron_expression", value: "0 9 * * *", description: "Cron schedule for automated backups" },
];

// ── Shared sub-components ─────────────────────────────────────────────────────
function Pill({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "3px 9px", borderRadius: 5,
      fontSize: 11, fontWeight: 700,
      textTransform: "uppercase", letterSpacing: "0.4px",
      background: bg, color,
    }}>
      {label.replace("_", " ")}
    </span>
  );
}

function StatCard({ label, value, sub, icon: Icon, accent = "var(--avatar-theme-color)" }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; accent?: string;
}) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 18px", display: "flex", alignItems: "flex-start", gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: 8, background: accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={20} color="#fff" />
      </div>
      <div>
        <p style={{ fontSize: 11, color: "#6b7280", fontWeight: 700, margin: 0, letterSpacing: "0.5px", textTransform: "uppercase" }}>{label}</p>
        <p style={{ fontSize: 26, fontWeight: 800, color: "#111827", margin: "4px 0 0" }}>{value}</p>
        {sub && <p style={{ fontSize: 11, color: "#9ca3af", margin: "2px 0 0" }}>{sub}</p>}
      </div>
    </div>
  );
}

function SectionHeader({ title, desc, action }: { title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111827", margin: 0 }}>{title}</h2>
        {desc && <p style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 0" }}>{desc}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

function TableHeader({ cols }: { cols: string[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols.length}, 1fr)`, background: "#f9fafb", borderBottom: "1px solid #e5e7eb", padding: "12px 20px", gap: 12 }}>
      {cols.map(c => (
        <div key={c} style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: "0.5px", textTransform: "uppercase" }}>{c}</div>
      ))}
    </div>
  );
}

function ActionBtn({ icon: Icon, label, color = "#374151", bg = "#f3f4f6", onClick }: {
  icon: React.ElementType; label: string; color?: string; bg?: string; onClick?: () => void;
}) {
  return (
    <button onClick={onClick} title={label} style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "5px 10px", borderRadius: 5, border: "none",
      background: bg, color, fontSize: 11, fontWeight: 600, cursor: "pointer",
    }}
      onMouseEnter={e => { e.currentTarget.style.opacity = "0.8"; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
    >
      <Icon size={12} /> {label}
    </button>
  );
}

// ── Tab: Overview ─────────────────────────────────────────────────────────────
function OverviewTab({ adminStats, statsLoading }: { adminStats: any; statsLoading: boolean }) {
  return (
    <div>
      <SectionHeader title="Platform Overview" desc="Real-time snapshot of platform activity and health." />

      {/* Stat grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <StatCard label="Total Users" value={statsLoading ? "—" : "1,284"} sub="registered accounts" icon={Users} />
        <StatCard label="Total Documents" value={statsLoading ? "—" : (adminStats?.totalDocuments ?? 0).toLocaleString()} sub="archive & library" icon={FileText} />
        <StatCard label="Active This Month" value={statsLoading ? "—" : (adminStats?.activeUsers ?? 0).toLocaleString()} sub="unique logins" icon={Activity} />
        <StatCard label="Storage Used" value={statsLoading ? "—" : `${adminStats?.storagePercentage ?? 84}%`} sub="of total capacity" icon={HardDrive} accent="#dc2626" />
      </div>

      {/* Quick action cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { icon: UserCog, label: "User Management", desc: "View, edit, and manage all registered users", tab: "users", color: "var(--avatar-theme-color)" },
          { icon: ClipboardList, label: "Audit Logs", desc: "Browse and export immutable activity records", tab: "audit", color: "#7c3aed" },
          { icon: Settings, label: "System Config", desc: "Manage session, password, and platform settings", tab: "config", color: "#0891b2" },
        ].map(item => (
          <div key={item.tab} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px", cursor: "pointer", transition: "box-shadow 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 8, background: item.color, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <item.icon size={18} color="#fff" />
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>{item.label}</p>
            <p style={{ fontSize: 12, color: "#6b7280", margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Pending access requests */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px" }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
          <Lock size={14} color="var(--avatar-theme-color)" /> Pending Access Requests
        </h3>
        <div style={{ padding: "32px", textAlign: "center", color: "#9ca3af" }}>
          <Lock size={28} color="#d1d5db" style={{ marginBottom: 8 }} />
          <p style={{ margin: 0, fontSize: 13 }}>No pending access requests</p>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Users ────────────────────────────────────────────────────────────────
function UsersTab() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editUser, setEditUser] = useState<any>(null);
  const [deleteModal, setDeleteModal] = useState<any>(null);

  const filtered = MOCK_USERS.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchStatus = statusFilter === "all" || u.membership_status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  return (
    <div>
      <SectionHeader
        title="User Management"
        desc="View, edit roles, and control account status for all registered users."
        action={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#6b7280" }}>{MOCK_USERS.length} total users</span>
          </div>
        }
      />

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200, display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "9px 12px" }}>
          <Search size={13} color="#9ca3af" />
          <input type="text" placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ background: "transparent", border: "none", outline: "none", fontSize: 13, color: "#111827", width: "100%" }} />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          style={{ padding: "9px 12px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, color: "#374151", outline: "none", cursor: "pointer" }}>
          <option value="all">All Roles</option>
          {["guest","member","student_author","researcher","archivist","librarian","admin"].map(r => (
            <option key={r} value={r}>{r.replace("_"," ")}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: "9px 12px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, color: "#374151", outline: "none", cursor: "pointer" }}>
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1.2fr 1.2fr 1fr 1.4fr", gap: 12, background: "#f9fafb", borderBottom: "1px solid #e5e7eb", padding: "12px 20px" }}>
          {["USER","EMAIL","ROLE","STATUS","JOINED","ACTIONS"].map(c => (
            <div key={c} style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: "0.5px" }}>{c}</div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>
            <Users size={28} color="#d1d5db" style={{ marginBottom: 8 }} />
            <p style={{ margin: 0, fontSize: 13 }}>No users match your filters</p>
          </div>
        ) : filtered.map((u, i) => (
          <div key={u.user_id} style={{
            display: "grid", gridTemplateColumns: "2fr 2fr 1.2fr 1.2fr 1fr 1.4fr",
            gap: 12, alignItems: "center", padding: "14px 20px",
            borderBottom: i < filtered.length - 1 ? "1px solid #f3f4f6" : "none",
            transition: "background 0.1s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "#fafafa"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--avatar-theme-color)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                {u.name[0].toUpperCase()}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#111827" }}>{u.name}</p>
                <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>{u.department}</p>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</p>
            <Pill label={u.role} bg={ROLE_COLORS[u.role]?.bg ?? "#f3f4f6"} color={ROLE_COLORS[u.role]?.color ?? "#6b7280"} />
            <Pill label={u.membership_status} bg={PILL[u.membership_status]?.bg ?? "#f3f4f6"} color={PILL[u.membership_status]?.color ?? "#6b7280"} />
            <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>{new Date(u.created_at).toLocaleDateString()}</p>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              <ActionBtn icon={Pencil} label="Edit" bg="#f0f9ff" color="#0369a1" onClick={() => setEditUser(u)} />
              <ActionBtn icon={u.membership_status === "suspended" ? UserCheck : Ban} label={u.membership_status === "suspended" ? "Activate" : "Suspend"} bg={u.membership_status === "suspended" ? "#d1fae5" : "#fde8e8"} color={u.membership_status === "suspended" ? "#065f46" : "#c81e1e"} onClick={() => toast.success(`User ${u.membership_status === "suspended" ? "activated" : "suspended"}`)} />
              <ActionBtn icon={Trash2} label="Delete" bg="#fde8e8" color="#c81e1e" onClick={() => setDeleteModal(u)} />
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editUser && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "28px 32px", width: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#111827" }}>Edit User Profile</h3>
              <button onClick={() => setEditUser(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}><X size={18} /></button>
            </div>
            {[
              { label: "Full Name", key: "name", type: "text" },
              { label: "Email Address", key: "email", type: "email" },
              { label: "Department", key: "department", type: "text" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>{f.label}</label>
                <input type={f.type} defaultValue={(editUser as any)[f.key]} style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, color: "#111827", outline: "none", boxSizing: "border-box" }}
                  onFocus={e => { e.currentTarget.style.borderColor = "var(--avatar-theme-color)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,0,0,0.06)"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "#d1d5db"; e.currentTarget.style.boxShadow = "none"; }} />
              </div>
            ))}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Role</label>
              <select defaultValue={editUser.role} style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, color: "#111827", outline: "none", background: "#fff" }}>
                {["guest","member","student_author","researcher","archivist","librarian","admin"].map(r => (
                  <option key={r} value={r}>{r.replace("_"," ")}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Access Tier Override</label>
              <select defaultValue="none" style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, color: "#111827", outline: "none", background: "#fff" }}>
                <option value="none">— No Override —</option>
                {["public","member","staff","restricted"].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setEditUser(null)} style={{ padding: "9px 18px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer" }}>Cancel</button>
              <button onClick={() => { toast.success("User updated successfully"); setEditUser(null); }} style={{ padding: "9px 18px", borderRadius: 6, border: "none", background: "var(--avatar-theme-color)", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "28px 32px", width: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#fde8e8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Trash2 size={18} color="#dc2626" />
              </div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#111827" }}>Delete User Account</h3>
            </div>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16, lineHeight: 1.6 }}>
              You are about to delete <strong style={{ color: "#111827" }}>{deleteModal.name}</strong>. This action is <strong style={{ color: "#dc2626" }}>irreversible</strong>. Choose a deletion mode:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {[
                { mode: "anonymize", label: "Anonymize (GDPR)", desc: "Removes personal data, preserves transaction history", color: "#d97706" },
                { mode: "hard_delete", label: "Hard Delete", desc: "Permanently removes the user record (only if no transactions)", color: "#dc2626" },
              ].map(opt => (
                <label key={opt.mode} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", border: "1px solid #e5e7eb", borderRadius: 8, cursor: "pointer" }}>
                  <input type="radio" name="deleteMode" value={opt.mode} defaultChecked={opt.mode === "anonymize"} style={{ marginTop: 2 }} />
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: opt.color }}>{opt.label}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setDeleteModal(null)} style={{ padding: "9px 18px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer" }}>Cancel</button>
              <button onClick={() => { toast.success("User deletion initiated"); setDeleteModal(null); }} style={{ padding: "9px 18px", borderRadius: 6, border: "none", background: "#dc2626", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" }}>Confirm Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Audit Logs ───────────────────────────────────────────────────────────
function AuditTab() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = MOCK_AUDIT.filter(l => {
    const matchSearch = !search || l.user_name.toLowerCase().includes(search.toLowerCase()) || l.user_id.includes(search);
    const matchAction = actionFilter === "all" || l.action === actionFilter;
    const matchEntity = entityFilter === "all" || l.entity_type === entityFilter;
    return matchSearch && matchAction && matchEntity;
  });

  return (
    <div>
      <SectionHeader
        title="Audit Log Viewer"
        desc="Immutable, append-only record of all state-changing platform events."
        action={
          <button onClick={() => toast.success("Exporting audit log as CSV…")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 7, border: "1px solid #e5e7eb", background: "#fff", fontSize: 12, fontWeight: 600, color: "#374151", cursor: "pointer" }}>
            <Download size={13} /> Export CSV
          </button>
        }
      />

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200, display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "9px 12px" }}>
          <Search size={13} color="#9ca3af" />
          <input type="text" placeholder="Filter by user ID or name…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ background: "transparent", border: "none", outline: "none", fontSize: 13, color: "#111827", width: "100%" }} />
        </div>
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
          style={{ padding: "9px 12px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, color: "#374151", outline: "none", cursor: "pointer" }}>
          <option value="all">All Actions</option>
          {["CREATE","UPDATE","DELETE","ACCESS","LOGIN","LOGOUT","DOWNLOAD","STATUS_CHANGE"].map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <select value={entityFilter} onChange={e => setEntityFilter(e.target.value)}
          style={{ padding: "9px 12px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, color: "#374151", outline: "none", cursor: "pointer" }}>
          <option value="all">All Entity Types</option>
          {["user","session","research_output","catalog_item","archive_item","backup","system_config"].map(t => (
            <option key={t} value={t}>{t.replace("_"," ")}</option>
          ))}
        </select>
        <div style={{ display: "flex", gap: 6 }}>
          <input type="date" style={{ padding: "9px 10px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12, color: "#374151", outline: "none" }} />
          <input type="date" style={{ padding: "9px 10px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12, color: "#374151", outline: "none" }} />
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1.4fr 1fr 1.2fr 1.2fr 0.6fr", gap: 12, background: "#f9fafb", borderBottom: "1px solid #e5e7eb", padding: "12px 20px" }}>
          {["TIMESTAMP","USER","ACTION","ENTITY TYPE","ENTITY ID","DETAILS"].map(c => (
            <div key={c} style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: "0.5px" }}>{c}</div>
          ))}
        </div>

        {filtered.map((log, i) => {
          const ac = ACTION_COLORS[log.action] ?? { bg: "#f3f4f6", color: "#6b7280" };
          const isExpanded = expanded === log.log_id;
          return (
            <div key={log.log_id}>
              <div style={{
                display: "grid", gridTemplateColumns: "1.6fr 1.4fr 1fr 1.2fr 1.2fr 0.6fr",
                gap: 12, alignItems: "center", padding: "13px 20px",
                borderBottom: "1px solid #f3f4f6", transition: "background 0.1s",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "#fafafa"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >
                <p style={{ margin: 0, fontSize: 12, color: "#374151", fontFamily: "monospace" }}>
                  {new Date(log.timestamp).toLocaleString()}
                </p>
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#111827" }}>{log.user_name}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "#9ca3af", fontFamily: "monospace" }}>{log.user_id}</p>
                </div>
                <Pill label={log.action} bg={ac.bg} color={ac.color} />
                <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{log.entity_type.replace("_"," ")}</p>
                <p style={{ margin: 0, fontSize: 11, color: "#9ca3af", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.entity_id}</p>
                <button onClick={() => setExpanded(isExpanded ? null : log.log_id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", display: "flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 600 }}>
                  <Eye size={12} /> {isExpanded ? "Hide" : "View"}
                </button>
              </div>
              {isExpanded && (
                <div style={{ padding: "12px 20px 16px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>Details (JSON)</p>
                  <pre style={{ margin: 0, fontSize: 12, color: "#374151", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, padding: "10px 14px", overflow: "auto" }}>
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>
            <ClipboardList size={28} color="#d1d5db" style={{ marginBottom: 8 }} />
            <p style={{ margin: 0, fontSize: 13 }}>No audit log entries match your filters</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
        <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>Showing {filtered.length} of {MOCK_AUDIT.length} entries</p>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", fontSize: 12, color: "#374151", cursor: "pointer" }}>
            <ChevronLeft size={13} />
          </button>
          <button style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: "var(--avatar-theme-color)", fontSize: 12, color: "#fff", cursor: "pointer", fontWeight: 700 }}>1</button>
          <button style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", fontSize: 12, color: "#374151", cursor: "pointer" }}>
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tab: System Config ────────────────────────────────────────────────────────
function ConfigTab() {
  const [config, setConfig] = useState(MOCK_CONFIG.reduce((acc, c) => ({ ...acc, [c.key]: c.value }), {} as Record<string, string>));
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    toast.success("System configuration saved successfully");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <SectionHeader title="System Configuration" desc="Manage global platform settings. Changes take effect immediately." />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {MOCK_CONFIG.map(item => (
          <div key={item.key} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "18px 20px" }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
              {item.key.replace(/_/g, " ")}
            </label>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 10px", lineHeight: 1.5 }}>{item.description}</p>
            {item.value === "true" || item.value === "false" ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  onClick={() => setConfig(prev => ({ ...prev, [item.key]: prev[item.key] === "true" ? "false" : "true" }))}
                  style={{
                    width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                    background: config[item.key] === "true" ? "var(--avatar-theme-color)" : "#d1d5db",
                    position: "relative", transition: "background 0.2s",
                  }}
                >
                  <span style={{
                    position: "absolute", top: 3, left: config[item.key] === "true" ? 23 : 3,
                    width: 18, height: 18, borderRadius: "50%", background: "#fff",
                    transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  }} />
                </button>
                <span style={{ fontSize: 13, fontWeight: 600, color: config[item.key] === "true" ? "#065f46" : "#6b7280" }}>
                  {config[item.key] === "true" ? "Enabled" : "Disabled"}
                </span>
              </div>
            ) : (
              <input
                type="text"
                value={config[item.key] ?? item.value}
                onChange={e => setConfig(prev => ({ ...prev, [item.key]: e.target.value }))}
                style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, color: "#111827", outline: "none", boxSizing: "border-box" }}
                onFocus={e => { e.currentTarget.style.borderColor = "var(--avatar-theme-color)"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "#d1d5db"; }}
              />
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
        <button onClick={handleSave} style={{ padding: "10px 24px", borderRadius: 7, border: "none", background: "var(--avatar-theme-color)", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <Check size={14} /> {saved ? "Saved!" : "Save Configuration"}
        </button>
      </div>
    </div>
  );
}

// ── Tab: Backups ──────────────────────────────────────────────────────────────
function BackupsTab() {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      toast.success("Backup generated and uploaded to S3 successfully");
    }, 2000);
  };

  const formatBytes = (bytes: number) => {
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  return (
    <div>
      <SectionHeader
        title="Backup Management"
        desc="Generate, schedule, and restore database backups stored in S3/MinIO."
        action={
          <button onClick={handleGenerate} disabled={generating} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 7, border: "none", background: "var(--avatar-theme-color)", fontSize: 13, fontWeight: 600, color: "#fff", cursor: generating ? "not-allowed" : "pointer", opacity: generating ? 0.7 : 1 }}>
            <Database size={14} /> {generating ? "Generating…" : "Generate Backup Now"}
          </button>
        }
      />

      {/* Schedule config */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "20px 24px", marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
          <Calendar size={14} color="var(--avatar-theme-color)" /> Backup Schedule
        </h3>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Cron Expression</label>
            <input type="text" defaultValue="0 9 * * *" placeholder="e.g. 0 9 * * *"
              style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, color: "#111827", outline: "none", boxSizing: "border-box" }}
              onFocus={e => { e.currentTarget.style.borderColor = "var(--avatar-theme-color)"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "#d1d5db"; }} />
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "#9ca3af" }}>Current: daily at 09:00 UTC</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 20 }}>
            <span style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>Enabled</span>
            <div style={{ width: 44, height: 24, borderRadius: 12, background: "var(--avatar-theme-color)", position: "relative", cursor: "pointer" }}>
              <span style={{ position: "absolute", top: 3, left: 23, width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
            </div>
          </div>
          <button onClick={() => toast.success("Backup schedule updated")} style={{ padding: "9px 16px", borderRadius: 6, border: "none", background: "#111827", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer", marginBottom: 20 }}>
            Update Schedule
          </button>
        </div>
      </div>

      {/* Backup list */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1.5fr 1fr 1fr", gap: 12, background: "#f9fafb", borderBottom: "1px solid #e5e7eb", padding: "12px 20px" }}>
          {["FILENAME","SIZE","CREATED AT","STATUS","ACTIONS"].map(c => (
            <div key={c} style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: "0.5px" }}>{c}</div>
          ))}
        </div>
        {MOCK_BACKUPS.map((b, i) => (
          <div key={b.backup_id} style={{
            display: "grid", gridTemplateColumns: "3fr 1fr 1.5fr 1fr 1fr",
            gap: 12, alignItems: "center", padding: "14px 20px",
            borderBottom: i < MOCK_BACKUPS.length - 1 ? "1px solid #f3f4f6" : "none",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "#fafafa"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Database size={14} color="#9ca3af" />
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#374151", fontFamily: "monospace" }}>{b.filename}</p>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{formatBytes(b.size_bytes)}</p>
            <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{new Date(b.created_at).toLocaleString()}</p>
            <Pill label={b.status} bg="#d1fae5" color="#065f46" />
            <div style={{ display: "flex", gap: 4 }}>
              <ActionBtn icon={Download} label="Download" bg="#f0f9ff" color="#0369a1" onClick={() => toast.success("Downloading backup…")} />
              <ActionBtn icon={RotateCcw} label="Restore" bg="#fef3c7" color="#92400e" onClick={() => toast.success("Restore initiated")} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab: Alerts ───────────────────────────────────────────────────────────────
function AlertsTab() {
  const [alerts, setAlerts] = useState(MOCK_ALERTS);

  const dismiss = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
    toast.success("Alert dismissed");
  };

  const ALERT_STYLES: Record<string, { bg: string; border: string; icon: string; color: string }> = {
    error_spike: { bg: "#fef2f2", border: "#fecaca", icon: "#dc2626", color: "#991b1b" },
    downtime:    { bg: "#fef3c7", border: "#fde68a", icon: "#d97706", color: "#92400e" },
    info:        { bg: "#f0f9ff", border: "#bae6fd", icon: "#0369a1", color: "#0c4a6e" },
  };

  return (
    <div>
      <SectionHeader
        title="Infrastructure Alerts"
        desc="System health notifications for downtime and error-rate spikes."
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => toast("Slack integration coming soon")} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 7, border: "1px solid #e5e7eb", background: "#fff", fontSize: 12, fontWeight: 600, color: "#374151", cursor: "pointer" }}>
              <Slack size={13} /> Configure Slack
            </button>
            <button onClick={() => toast("Email alert config coming soon")} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 7, border: "1px solid #e5e7eb", background: "#fff", fontSize: 12, fontWeight: 600, color: "#374151", cursor: "pointer" }}>
              <Mail size={13} /> Configure Email
            </button>
          </div>
        }
      />

      {/* Health status bar */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#16a34a", boxShadow: "0 0 0 3px #d1fae5" }} />
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#111827" }}>System Operational</p>
          <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>All services healthy · Last checked 42 seconds ago</p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 20 }}>
          {[
            { label: "API", status: "healthy" },
            { label: "Database", status: "healthy" },
            { label: "S3 Storage", status: "healthy" },
            { label: "Elasticsearch", status: "healthy" },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a", margin: "0 auto 4px" }} />
              <p style={{ margin: 0, fontSize: 11, color: "#6b7280", fontWeight: 600 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Alert list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {alerts.map(alert => {
          const style = ALERT_STYLES[alert.type] ?? ALERT_STYLES.info;
          const IconComp = alert.type === "error_spike" ? Zap : alert.type === "downtime" ? Server : Bell;
          return (
            <div key={alert.id} style={{
              background: alert.read ? "#fafafa" : style.bg,
              border: `1px solid ${alert.read ? "#e5e7eb" : style.border}`,
              borderRadius: 10, padding: "16px 20px",
              display: "flex", alignItems: "flex-start", gap: 14,
              opacity: alert.read ? 0.6 : 1, transition: "opacity 0.2s",
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: alert.read ? "#e5e7eb" : style.bg, border: `1px solid ${alert.read ? "#d1d5db" : style.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <IconComp size={16} color={alert.read ? "#9ca3af" : style.icon} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: alert.read ? "#6b7280" : style.color }}>{alert.title}</p>
                  {!alert.read && <span style={{ fontSize: 10, fontWeight: 700, background: style.icon, color: "#fff", padding: "2px 6px", borderRadius: 4 }}>NEW</span>}
                </div>
                <p style={{ margin: 0, fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>{alert.message}</p>
                <p style={{ margin: "6px 0 0", fontSize: 11, color: "#9ca3af" }}>{new Date(alert.timestamp).toLocaleString()}</p>
              </div>
              {!alert.read && (
                <button onClick={() => dismiss(alert.id)} style={{ padding: "5px 10px", borderRadius: 5, border: "1px solid #e5e7eb", background: "#fff", fontSize: 11, fontWeight: 600, color: "#374151", cursor: "pointer", flexShrink: 0 }}>
                  Dismiss
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");

  // Non-admin state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const isStudent = ["student", "student_author"].includes(user?.role ?? "");
  const memberId = user?.user_id ?? "";

  const { data: adminStats, isLoading: statsLoading } = useAdminStats();
  const { data: catalogDocsData, isLoading: catalogDocsLoading } = useCatalogDocuments({ page: currentPage, limit: 10, search: searchQuery, status: filterStatus !== "all" ? filterStatus : undefined });
  const { data: researchSubmissionsData, isLoading: researchLoading } = useResearcherSubmissions({ page: currentPage, limit: 10, search: searchQuery, status: filterStatus !== "all" ? filterStatus : undefined });
  const { data: archiveDocsData, isLoading: archiveLoading } = useArchiveDocuments({ page: currentPage, limit: 10, search: searchQuery, status: filterStatus !== "all" ? filterStatus : undefined });
  const { data: borrowHistory, isLoading: borrowLoading } = useBorrowingHistory(memberId);
  const { data: memberHolds, isLoading: holdsLoading } = useMemberHolds(memberId);
  const { data: finesData, isLoading: finesLoading } = useMemberFines(memberId);
  const isArchivistOrAdmin = ["archivist", "admin"].includes(user?.role ?? "");
  const { data: pendingRequests, refetch: refetchRequests } = usePendingAccessRequests();
  const { mutateAsync: reviewRequest } = useReviewAccessRequest();

  const combinedItems: any[] = [];
  if (borrowHistory) combinedItems.push(...borrowHistory);
  if (memberHolds) combinedItems.push(...memberHolds);
  combinedItems.sort((a: any, b: any) => new Date(b.request_date || b.issue_date || b.created_at).getTime() - new Date(a.request_date || a.issue_date || a.created_at).getTime());

  const filteredCombinedItems = combinedItems.filter((item: any) => {
    if (filterStatus !== "all" && item.status !== filterStatus) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return item.title?.toLowerCase().includes(q) || (Array.isArray(item.authors) ? item.authors.join(", ").toLowerCase().includes(q) : false) || item.isbn?.toLowerCase().includes(q);
  });

  const activeLoansCount = borrowHistory?.filter((t: any) => t.status === "active" || t.status === "overdue").length ?? 0;
  const activeHoldsCount = memberHolds?.filter((h: any) => h.status === "pending" || h.status === "available").length ?? 0;

  const documentsData = user?.role === "researcher" ? researchSubmissionsData : user?.role === "archivist" ? archiveDocsData : catalogDocsData;
  const docsLoading = isStudent ? (borrowLoading || holdsLoading || finesLoading) : (user?.role === "researcher" ? researchLoading : user?.role === "archivist" ? archiveLoading : catalogDocsLoading);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    if (user?.role === "librarian") { router.push("/librarian"); return; }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role === "librarian") return null;

  // ── ADMIN: full tabbed panel ──────────────────────────────────────────────
  if (user?.role === "admin") {
    const TABS: { id: AdminTab; label: string; icon: React.ElementType }[] = [
      { id: "overview", label: "Overview", icon: LayoutDashboard },
      { id: "users",    label: "Users",    icon: Users },
      { id: "audit",    label: "Audit Logs", icon: ClipboardList },
      { id: "config",   label: "System Config", icon: Settings },
      { id: "backups",  label: "Backups",  icon: Database },
      { id: "alerts",   label: "Alerts",   icon: Bell },
    ];

    return (
      <AppLayout>
        <div style={{ padding: "28px 32px" }}>
          {/* Page heading */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--avatar-theme-color)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ShieldCheck size={18} color="#fff" />
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--avatar-theme-color)", margin: 0, lineHeight: 1.2 }}>
                Platform Administration
              </h1>
            </div>
            <p style={{ fontSize: 13, color: "#6b7280", margin: 0, paddingLeft: 46 }}>
              Monitor platform activity, manage users, and configure system settings.
            </p>
          </div>

          {/* Tab bar */}
          <div style={{ display: "flex", gap: 2, borderBottom: "2px solid #e5e7eb", marginBottom: 28 }}>
            {TABS.map(tab => {
              const active = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "10px 16px", border: "none", background: "transparent",
                  fontSize: 13, fontWeight: active ? 700 : 500,
                  color: active ? "var(--avatar-theme-color)" : "#6b7280",
                  cursor: "pointer", borderBottom: active ? "2px solid var(--avatar-theme-color)" : "2px solid transparent",
                  marginBottom: -2, transition: "all 0.15s",
                }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = "#374151"; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = "#6b7280"; }}
                >
                  <tab.icon size={14} />
                  {tab.label}
                  {tab.id === "alerts" && MOCK_ALERTS.filter(a => !a.read).length > 0 && (
                    <span style={{ width: 16, height: 16, borderRadius: "50%", background: "#dc2626", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {MOCK_ALERTS.filter(a => !a.read).length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          {activeTab === "overview" && <OverviewTab adminStats={adminStats} statsLoading={statsLoading} />}
          {activeTab === "users"    && <UsersTab />}
          {activeTab === "audit"    && <AuditTab />}
          {activeTab === "config"   && <ConfigTab />}
          {activeTab === "backups"  && <BackupsTab />}
          {activeTab === "alerts"   && <AlertsTab />}
        </div>
      </AppLayout>
    );
  }

  // ── NON-ADMIN: original unchanged layout ─────────────────────────────────
  const roleTitle = isStudent ? "Admin panel" : ({
    researcher: "My Submissions", member: "Member Dashboard",
    student: "Student Portal", student_author: "Student Submissions",
    archivist: "Archive Management",
  } as Record<string, string>)[user?.role ?? ""] || "Admin Panel";

  const roleDescription = isStudent ? "View your borrowed books, active reservations, loan durations, and pending fines." : ({
    researcher: "View and manage your research submissions under review.",
    member: "Manage your contributions and submissions.",
    student: "View your learning resources and submissions.",
    student_author: "Submit and track academic and student projects.",
    archivist: "Oversee digital archives and preservation tasks.",
  } as Record<string, string>)[user?.role ?? ""] || "Admin panel for platform management";

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin"] });
    queryClient.invalidateQueries({ queryKey: ["library"] });
    queryClient.invalidateQueries({ queryKey: ["archive"] });
    toast.success("Data refreshed");
  };

  return (
    <AppLayout>
      <div style={{ padding: "28px 32px" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 40, fontWeight: 800, color: "var(--avatar-theme-color)", margin: 0, lineHeight: 1.2 }}>{roleTitle}</h1>
          <p style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>{roleDescription}</p>
        </div>

        {/* Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: user?.role === "researcher" ? "repeat(1, 1fr)" : "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
          {isStudent ? (
            <>
              <StatCard label="Borrowed Books" value={docsLoading ? "—" : activeLoansCount} sub="currently borrowed" icon={BookOpen} />
              <StatCard label="Reserved Books" value={docsLoading ? "—" : activeHoldsCount} sub="active holds / reservations" icon={HardDrive} />
              <StatCard label="Total Fines" value={docsLoading ? "—" : `${finesData?.total_pending ?? 0} TK`} sub="flat 100 TK fine for overdue books" icon={AlertCircle} accent={(finesData?.total_pending ?? 0) > 0 ? "#dc2626" : "var(--avatar-theme-color)"} />
            </>
          ) : user?.role === "researcher" ? (
            <StatCard label="My Submissions Under Review" value={statsLoading ? "—" : adminStats?.pendingReview ?? 0} sub={adminStats?.pendingReview ? "awaiting decision" : "all approved"} icon={AlertCircle} accent="#dc2626" />
          ) : (
            <>
              <StatCard label="Total Documents" value={statsLoading ? "—" : (adminStats?.totalDocuments ?? 0).toLocaleString()} sub="Archive & Library combined" icon={FileText} />
              <StatCard label="Active Users" value={statsLoading ? "—" : (adminStats?.activeUsers ?? 0).toLocaleString()} sub="online this month" icon={Users} />
              <StatCard label="Storage Used" value={statsLoading ? "—" : `${adminStats?.storagePercentage ?? 0}%`} sub="of total capacity" icon={HardDrive} />
            </>
          )}
        </div>

        {/* Search & Filter Bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, justifyContent: "space-between" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px" }}>
            <Search size={14} color="#9ca3af" />
            <input type="text" placeholder="Search by title, author, or DOI..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              style={{ background: "transparent", border: "none", outline: "none", fontSize: 13, color: "#1f2937", width: "100%" }} />
          </div>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            style={{ padding: "10px 14px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#374151", outline: "none", cursor: "pointer" }}>
            <option value="all">All Statuses</option>
            {isStudent ? (<><option value="active">Active Borrowed</option><option value="overdue">Overdue Books</option><option value="returned">Returned Books</option><option value="pending">Pending Hold</option><option value="available">Available Hold</option></>) : (<><option value="published">Published</option><option value="pending_review">Pending Review</option><option value="changes_requested">Changes Requested</option><option value="draft">Draft</option></>)}
          </select>
          <button onClick={() => { setFilterStatus("all"); setSearchQuery(""); setCurrentPage(1); }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", background: (filterStatus !== "all" || searchQuery) ? "var(--avatar-theme-color)" : "#fff", border: (filterStatus !== "all" || searchQuery) ? "none" : "1px solid #e5e7eb", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, color: (filterStatus !== "all" || searchQuery) ? "#fff" : "#6b7280" }}>
            <Filter size={14} />{(filterStatus !== "all" || searchQuery) ? "Clear" : "Filter"}
          </button>
          <button onClick={handleRefresh} style={{ width: 36, height: 36, padding: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <RefreshCw size={14} color="#6b7280" />
          </button>
        </div>

        {/* Access Requests (archivist) */}
        {isArchivistOrAdmin && pendingRequests && pendingRequests.length > 0 && (
          <div style={{ background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", border: "1px solid #bfdbfe", borderRadius: 12, padding: "20px 24px", marginBottom: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "#1e3a8a", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
              <Lock size={16} /> Restricted Document Access Requests ({pendingRequests.length})
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {pendingRequests.map((req: any) => (
                <div key={req.request_id} style={{ background: "#fff", border: "1px solid #bfdbfe", borderRadius: 8, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#111827" }}>Request by: <span style={{ color: "#2563eb" }}>{req.user_name}</span> ({req.user_email})</p>
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: "#374151" }}>Document: <strong>{req.item_title}</strong></p>
                    <p style={{ margin: "8px 0 0", fontSize: 13, color: "#6b7280", fontStyle: "italic", background: "#f9fafb", padding: "6px 10px", borderRadius: 6, borderLeft: "3px solid #2563eb" }}>&ldquo;{req.reason}&rdquo;</p>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={async () => { try { await reviewRequest({ requestId: req.request_id, status: "approved" }); toast.success("Approved!"); refetchRequests(); } catch { toast.error("Failed"); } }} style={{ padding: "8px 14px", borderRadius: 6, border: "none", background: "#16a34a", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><Check size={12} /> Approve</button>
                    <button onClick={async () => { try { await reviewRequest({ requestId: req.request_id, status: "denied" }); toast.success("Denied!"); refetchRequests(); } catch { toast.error("Failed"); } }} style={{ padding: "8px 14px", borderRadius: 6, border: "1px solid #fca5a5", background: "#fee2e2", color: "#991b1b", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><X size={12} /> Deny</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Student policy notice */}
        {isStudent && (
          <div style={{ background: "linear-gradient(135deg, #fef2f2 0%, #ffe4e6 100%)", border: "1px solid #fca5a5", borderRadius: 12, padding: "16px 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
            <AlertCircle size={20} color="#dc2626" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: 13, color: "#991b1b", fontWeight: 500, lineHeight: 1.5 }}>
              <span style={{ fontWeight: 700 }}>Library Policy Notice:</span> Books must be returned within the designated time duration. A flat fine of <span style={{ fontWeight: 700, color: "#b91c1c" }}>100 TK</span> will be charged per overdue book.
            </div>
          </div>
        )}

        {/* Table */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
          {docsLoading ? (
            <div style={{ padding: "32px 24px" }}>{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 mb-3" />)}</div>
          ) : isStudent ? (
            !filteredCombinedItems || filteredCombinedItems.length === 0 ? (
              <div style={{ padding: "40px 24px", textAlign: "center", color: "#6b7280" }}><p>No borrowed or reserved books found</p></div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 2fr 1fr", gap: 16, background: "#f9fafb", borderBottom: "1px solid #e5e7eb", padding: "14px 20px", fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: "0.5px" }}>
                  {["BOOK TITLE / DETAILS","TRANSACTION TYPE","STATUS","TIME DURATION","FINE AMOUNT"].map(c => <div key={c}>{c}</div>)}
                </div>
                {filteredCombinedItems.map((item: any) => {
                  const isHold = "hold_id" in item;
                  let pillStyle = { bg: "#f3f4f6", color: "#6b7280" };
                  if (item.status === "active") pillStyle = { bg: "#e6f4ea", color: "#1e7e34" };
                  else if (item.status === "overdue") pillStyle = { bg: "#fde8e8", color: "#c81e1e" };
                  else if (item.status === "pending") pillStyle = { bg: "#e8f0fe", color: "#1a56db" };
                  else if (item.status === "available") pillStyle = { bg: "#e6f4ea", color: "#1e7e34" };
                  const durationText = isHold ? `Reserved on ${new Date(item.request_date).toLocaleDateString()}` : item.status === "returned" && item.return_date ? `Issued: ${new Date(item.issue_date).toLocaleDateString()} | Returned: ${new Date(item.return_date).toLocaleDateString()}` : `Issued: ${new Date(item.issue_date).toLocaleDateString()} | Due: ${new Date(item.due_date).toLocaleDateString()}`;
                  return (
                    <div key={isHold ? item.hold_id : item.transaction_id} style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 2fr 1fr", gap: 16, alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #e5e7eb", fontSize: 13 }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#fafafa"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                      <div><p style={{ margin: 0, fontWeight: 600, color: "#1f2937" }}>{item.title}</p><p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b7280" }}>{Array.isArray(item.authors) ? item.authors.join(", ") : item.authors ?? "Unknown"}</p></div>
                      <div style={{ fontWeight: 500, color: "#4b5563" }}>{isHold ? "Reservation" : "Borrow"}</div>
                      <div><span style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", background: pillStyle.bg, color: pillStyle.color }}>{item.status}</span></div>
                      <div style={{ color: "#374151", fontWeight: 500 }}>{durationText}</div>
                      <div style={{ textAlign: "right", fontWeight: 700, color: item.status === "overdue" ? "#dc2626" : "#6b7280" }}>{item.status === "overdue" ? "100 TK" : "—"}</div>
                    </div>
                  );
                })}
              </>
            )
          ) : !documentsData?.items || documentsData.items.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center", color: "#6b7280" }}><p>No documents found</p></div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 0.8fr", gap: 16, background: "#f9fafb", borderBottom: "1px solid #e5e7eb", padding: "14px 20px", fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: "0.5px" }}>
                {[user?.role === "researcher" ? "SUBMISSION TITLE" : "DOCUMENT DETAIL", user?.role === "researcher" ? "TYPE / COLLABORATORS" : "AUTHOR / FACULTY", "STATUS", "LAST MODIFIED", "ACCESS", "ACTIONS"].map(c => <div key={c}>{c}</div>)}
              </div>
              {documentsData.items.map((doc: any) => {
                const statusStyle = PILL[doc.status] || PILL.draft;
                return (
                  <div key={doc.id} style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 0.8fr", gap: 16, alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #e5e7eb", fontSize: 13 }}>
                    <div><p style={{ margin: 0, fontWeight: 600, color: "#1f2937" }}>{doc.title}</p><p style={{ margin: "4px 0 0", fontSize: 12, color: "#9ca3af" }}>{doc.download_count || 0} downloads</p></div>
                    <div><p style={{ margin: 0, fontWeight: 500, color: "#374151" }}>{typeof doc.authors === "string" ? doc.authors : Array.isArray(doc.authors) ? doc.authors.join(", ") : "—"}</p><p style={{ margin: "2px 0 0", fontSize: 12, color: "#9ca3af" }}>{doc.department}</p></div>
                    <div><span style={{ display: "inline-flex", padding: "3px 8px", borderRadius: 5, fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: statusStyle.bg, color: statusStyle.color }}>{doc.status}</span></div>
                    <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{doc.updated_at ? new Date(doc.updated_at).toLocaleDateString() : "—"}</p>
                    <p style={{ margin: 0, fontSize: 12, color: "#6b7280", textTransform: "capitalize" }}>{doc.access}</p>
                    <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                      <button onClick={() => toast.success("Access level updated")} style={{ padding: "4px 8px", borderRadius: 4, border: "none", background: "#f3f4f6", cursor: "pointer", display: "flex", alignItems: "center" }}><Eye size={12} color="#6b7280" /></button>
                      <button onClick={() => toast.success("Document removed")} style={{ padding: "4px 8px", borderRadius: 4, border: "none", background: "#fde8e8", cursor: "pointer", display: "flex", alignItems: "center" }}><Trash2 size={12} color="#dc2626" /></button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Pagination for non-student */}
        {!isStudent && documentsData && documentsData.total > 10 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
            <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>Page {currentPage} of {Math.ceil(documentsData.total / 10)}</p>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", fontSize: 12, color: "#374151", cursor: "pointer" }}><ChevronLeft size={13} /></button>
              <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= Math.ceil(documentsData.total / 10)} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", fontSize: 12, color: "#374151", cursor: "pointer" }}><ChevronRight size={13} /></button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
