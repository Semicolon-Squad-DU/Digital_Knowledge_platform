"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Building2, Shield } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
  }, [isAuthenticated, router]);

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Profile</h1>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <User className="text-slate-500" size={18} />
          <div>
            <p className="text-xs text-slate-500">Name</p>
            <p className="text-sm font-medium text-slate-900">{user.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Mail className="text-slate-500" size={18} />
          <div>
            <p className="text-xs text-slate-500">Email</p>
            <p className="text-sm font-medium text-slate-900">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Building2 className="text-slate-500" size={18} />
          <div>
            <p className="text-xs text-slate-500">Department</p>
            <p className="text-sm font-medium text-slate-900">{user.department || "Not specified"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Shield className="text-slate-500" size={18} />
          <div>
            <p className="text-xs text-slate-500">Role</p>
            <p className="text-sm font-medium text-slate-900">{user.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
