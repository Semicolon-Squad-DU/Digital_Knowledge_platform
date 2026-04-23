"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Building2, Shield, Edit2, X, Lock, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, updateProfile, changePassword } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
  }, [isAuthenticated, router]);

  // Profile edit state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [department, setDepartment] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Password change state
  const [showPwSection, setShowPwSection] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isChangingPw, setIsChangingPw] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setBio((user as { bio?: string }).bio ?? "");
      setDepartment(user.department ?? "");
      setAvatarUrl((user as { avatar_url?: string }).avatar_url ?? "");
    }
  }, [user]);

  if (!user) return null;

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateProfile({ name, bio, department, avatar_url: avatarUrl || undefined });
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setName(user.name ?? "");
    setBio((user as { bio?: string }).bio ?? "");
    setDepartment(user.department ?? "");
    setAvatarUrl((user as { avatar_url?: string }).avatar_url ?? "");
    setIsEditing(false);
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw) {
      toast.error("Both fields are required");
      return;
    }
    setIsChangingPw(true);
    try {
      await changePassword(currentPw, newPw);
      toast.success("Password changed successfully. Please log in again.");
      setCurrentPw("");
      setNewPw("");
      setShowPwSection(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Failed to change password");
    } finally {
      setIsChangingPw(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        {!isEditing && (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} icon={<Edit2 size={14} />}>
            Edit Profile
          </Button>
        )}
      </div>

      {/* Avatar */}
      {(user as { avatar_url?: string }).avatar_url && !isEditing && (
        <div className="flex justify-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={(user as { avatar_url?: string }).avatar_url}
            alt="Avatar"
            className="w-20 h-20 rounded-full object-cover border-2 border-slate-200"
          />
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 mb-6">
        {isEditing ? (
          <>
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              required
            />
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A short bio about yourself"
                rows={3}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>
            <Input
              label="Department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Computer Science"
            />
            <Input
              label="Avatar URL"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
            />
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSaveProfile} loading={isSaving}>Save Changes</Button>
              <Button variant="outline" onClick={handleCancelEdit} icon={<X size={14} />}>
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <User className="text-slate-500" size={18} />
              <div>
                <p className="text-xs text-slate-500">Name</p>
                <p className="text-sm font-medium text-slate-900">{user.name}</p>
              </div>
            </div>

            {(user as { bio?: string }).bio && (
              <div className="flex items-start gap-3">
                <Edit2 className="text-slate-500 mt-0.5" size={18} />
                <div>
                  <p className="text-xs text-slate-500">Bio</p>
                  <p className="text-sm text-slate-700">{(user as { bio?: string }).bio}</p>
                </div>
              </div>
            )}

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
          </>
        )}
      </div>

      {/* Password Change Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-slate-500" />
            <h2 className="text-base font-semibold text-slate-900">Change Password</h2>
          </div>
          {!showPwSection && (
            <Button variant="outline" size="sm" onClick={() => setShowPwSection(true)}>
              Change Password
            </Button>
          )}
        </div>

        {showPwSection && (
          <div className="space-y-4">
            <div className="relative">
              <Input
                label="Current Password"
                type={showCurrent ? "text" : "password"}
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="Enter current password"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
                onClick={() => setShowCurrent((v) => !v)}
                aria-label={showCurrent ? "Hide password" : "Show password"}
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="relative">
              <Input
                label="New Password"
                type={showNew ? "text" : "password"}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="8+ chars, upper/lower/digit/special"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
                onClick={() => setShowNew((v) => !v)}
                aria-label={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="flex gap-3 pt-1">
              <Button onClick={handleChangePassword} loading={isChangingPw}>Update Password</Button>
              <Button
                variant="outline"
                onClick={() => { setShowPwSection(false); setCurrentPw(""); setNewPw(""); }}
                icon={<X size={14} />}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

