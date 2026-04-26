"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Building2, Shield, Edit2, Save, X, Eye, EyeOff, Lock, CheckCircle, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/Button";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, updateProfile, changePassword } = useAuthStore();
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    department: "",
    avatar_url: "",
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        bio: user.bio || "",
        department: user.department || "",
        avatar_url: user.avatar_url || "",
      });
    }
  }, [user]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleProfileChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    if (!formData.name.trim()) {
      showToast("error", "Name is required");
      return;
    }

    setIsLoading(true);
    try {
      await updateProfile({
        name: formData.name,
        bio: formData.bio,
        department: formData.department,
        avatar_url: formData.avatar_url,
      });
      showToast("success", "Profile updated successfully!");
      setIsEditMode(false);
    } catch (error: any) {
      showToast("error", error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.current_password) {
      showToast("error", "Current password is required");
      return;
    }
    if (!passwordData.new_password) {
      showToast("error", "New password is required");
      return;
    }
    if (passwordData.new_password !== passwordData.confirm_password) {
      showToast("error", "Passwords do not match");
      return;
    }
    if (passwordData.new_password.length < 8) {
      showToast("error", "Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    try {
      await changePassword(passwordData.current_password, passwordData.new_password, passwordData.confirm_password);
      showToast("success", "Password changed successfully!");
      setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
      setShowPasswordForm(false);
    } catch (error: any) {
      showToast("error", error.response?.data?.message || "Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Profile</h1>
            <p className="text-slate-600 mt-1">Manage your account and settings</p>
          </div>
          {!isEditMode && !showPasswordForm && (
            <button
              onClick={() => setIsEditMode(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Edit2 size={18} />
              Edit Profile
            </button>
          )}
        </div>

        {/* Toast Notification */}
        {toast && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 animate-in fade-in duration-300 ${
              toast.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle size={20} className="flex-shrink-0" />
            ) : (
              <AlertCircle size={20} className="flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        )}

        {/* Profile Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 mb-6">
          {!isEditMode ? (
            // View Mode
            <div className="space-y-6">
              {/* Avatar */}
              {user.avatar_url && (
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      className="w-24 h-24 rounded-full border-4 border-blue-200 object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Profile Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="md:col-span-2">
                  <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg border border-blue-100">
                    <User className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Name</p>
                      <p className="text-lg font-semibold text-slate-900 mt-1">{user.name}</p>
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg border border-purple-100">
                    <Mail className="text-purple-600 flex-shrink-0 mt-1" size={20} />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Email</p>
                      <p className="text-sm font-medium text-slate-900 mt-1">{user.email}</p>
                    </div>
                  </div>
                </div>

                {/* Department */}
                <div>
                  <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-lg border border-amber-100">
                    <Building2 className="text-amber-600 flex-shrink-0 mt-1" size={20} />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Department</p>
                      <p className="text-sm font-medium text-slate-900 mt-1">{user.department || "Not specified"}</p>
                    </div>
                  </div>
                </div>

                {/* Role */}
                <div>
                  <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-green-50 to-green-100/50 rounded-lg border border-green-100">
                    <Shield className="text-green-600 flex-shrink-0 mt-1" size={20} />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Role</p>
                      <p className="text-sm font-medium text-slate-900 capitalize mt-1">{user.role.replace(/_/g, " ")}</p>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {user.bio && (
                  <div className="md:col-span-2">
                    <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-lg border border-slate-200">
                      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Bio</p>
                      <p className="text-sm text-slate-700 leading-relaxed">{user.bio}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Edit Mode
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Edit Profile</h2>

              {/* Avatar URL Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Avatar URL</label>
                <input
                  type="url"
                  value={formData.avatar_url}
                  onChange={(e) => handleProfileChange("avatar_url", e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
                {formData.avatar_url && (
                  <div className="mt-3 flex justify-center">
                    <img
                      src={formData.avatar_url}
                      alt="Preview"
                      className="w-20 h-20 rounded-full border-4 border-blue-200 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://via.placeholder.com/80";
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleProfileChange("name", e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => handleProfileChange("department", e.target.value)}
                  placeholder="Your department"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleProfileChange("bio", e.target.value)}
                  placeholder="Tell us about yourself (max 500 characters)"
                  maxLength={500}
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                />
                <p className="text-xs text-slate-500 mt-1">{formData.bio.length}/500 characters</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t border-slate-200">
                <button
                  onClick={handleSaveProfile}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-lg font-medium transition-colors"
                >
                  <Save size={18} />
                  {isLoading ? "Saving..." : "Save Profile"}
                </button>
                <button
                  onClick={() => {
                    setIsEditMode(false);
                    setFormData({
                      name: user.name || "",
                      bio: user.bio || "",
                      department: user.department || "",
                      avatar_url: user.avatar_url || "",
                    });
                  }}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg font-medium transition-colors"
                >
                  <X size={18} />
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Password Change Section */}
        {!isEditMode && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            {!showPasswordForm ? (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Lock className="text-slate-600" size={20} />
                  <div className="text-left">
                    <p className="font-semibold text-slate-900">Change Password</p>
                    <p className="text-sm text-slate-600">Update your password to keep your account secure</p>
                  </div>
                </div>
                <Edit2 className="text-slate-400" size={20} />
              </button>
            ) : (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-900">Change Password</h2>

                {/* Current Password */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Current Password *</label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordData.current_password}
                      onChange={(e) => handlePasswordChange("current_password", e.target.value)}
                      placeholder="Enter current password"
                      className="w-full px-4 py-2 pr-10 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords((prev) => ({ ...prev, current: !prev.current }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">New Password *</label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordData.new_password}
                      onChange={(e) => handlePasswordChange("new_password", e.target.value)}
                      placeholder="Enter new password (min 8 characters)"
                      className="w-full px-4 py-2 pr-10 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords((prev) => ({ ...prev, new: !prev.new }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Must contain uppercase, lowercase, number, and special character</p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm Password *</label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordData.confirm_password}
                      onChange={(e) => handlePasswordChange("confirm_password", e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full px-4 py-2 pr-10 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-6 border-t border-slate-200">
                  <button
                    onClick={handleChangePassword}
                    disabled={isLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white rounded-lg font-medium transition-colors"
                  >
                    <Lock size={18} />
                    {isLoading ? "Updating..." : "Change Password"}
                  </button>
                  <button
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
                    }}
                    disabled={isLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg font-medium transition-colors"
                  >
                    <X size={18} />
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
