"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  User,
  Mail,
  Calendar,
  Loader2,
  Save,
  KeyRound,
  Trash2,
  AlertTriangle,
  Flame,
  CheckCircle,
} from "lucide-react";

interface ProfileData {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [email, setEmail] = useState("");
  const [accountCreated, setAccountCreated] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Delete account state
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    fetchProfile();
  }, [user, router]);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch profile");
      }

      setProfile(data.profile);
      setEmail(data.email);
      setAccountCreated(new Date(data.created_at).toLocaleDateString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: profile?.username,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      setProfile(data.profile);
      setMessage("Profile updated successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to change password");
      }

      setMessage("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsDeleting(true);

    try {
      const response = await fetch("/api/profile/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete account");
      }

      await signOut();
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account");
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-orange-50/50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg mb-4">
            <Flame className="h-6 w-6 text-white fire-icon" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">Your Profile</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Alerts */}
        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700">
            <CheckCircle className="h-5 w-5" />
            {message}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            {error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Account Information */}
          <div className="card-gradient rounded-2xl p-6 border border-orange-100">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-orange-500" />
              Account Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Email Address
                </label>
                <div className="flex items-center gap-2 mt-1 p-3 bg-white rounded-xl border border-orange-100">
                  <Mail className="h-4 w-4 text-orange-400" />
                  <span className="text-sm">{email}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Member Since
                </label>
                <div className="flex items-center gap-2 mt-1 p-3 bg-white rounded-xl border border-orange-100">
                  <Calendar className="h-4 w-4 text-orange-400" />
                  <span className="text-sm">{accountCreated}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  User ID
                </label>
                <div className="mt-1 p-3 bg-white rounded-xl border border-orange-100">
                  <span className="text-xs text-muted-foreground font-mono break-all">
                    {profile?.id}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Profile */}
          <div className="card-gradient rounded-2xl p-6 border border-orange-100">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Save className="h-5 w-5 text-orange-500" />
              Edit Profile
            </h2>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label
                  htmlFor="username"
                  className="text-sm font-medium text-foreground"
                >
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={profile?.username || ""}
                  onChange={(e) =>
                    setProfile((prev) =>
                      prev ? { ...prev, username: e.target.value } : null
                    )
                  }
                  className="w-full mt-1 px-4 py-2.5 border border-orange-200 rounded-xl bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 btn-gradient text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div className="card-gradient rounded-2xl p-6 border border-orange-100">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-orange-500" />
              Change Password
            </h2>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label
                  htmlFor="currentPassword"
                  className="text-sm font-medium text-foreground"
                >
                  Current Password
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full mt-1 px-4 py-2.5 border border-orange-200 rounded-xl bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
                />
              </div>

              <div>
                <label
                  htmlFor="newPassword"
                  className="text-sm font-medium text-foreground"
                >
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full mt-1 px-4 py-2.5 border border-orange-200 rounded-xl bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium text-foreground"
                >
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full mt-1 px-4 py-2.5 border border-orange-200 rounded-xl bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isChangingPassword}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 btn-gradient text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    Change Password
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Delete Account */}
          <div className="card-gradient rounded-2xl p-6 border border-red-100">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Account
            </h2>

            <p className="text-sm text-muted-foreground mb-4">
              This action cannot be undone. All your recipes, favorites, and
              data will be permanently deleted.
            </p>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete My Account
              </button>
            ) : (
              <form onSubmit={handleDeleteAccount} className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-700 font-medium mb-2">
                    Are you absolutely sure?
                  </p>
                  <p className="text-xs text-red-600">
                    This will permanently delete your account and all associated
                    data.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="deletePassword"
                    className="text-sm font-medium text-foreground"
                  >
                    Enter your password to confirm
                  </label>
                  <input
                    id="deletePassword"
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    required
                    className="w-full mt-1 px-4 py-2.5 border border-red-200 rounded-xl bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeletePassword("");
                    }}
                    className="flex-1 px-4 py-2.5 border border-orange-200 text-foreground rounded-xl font-medium hover:bg-orange-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isDeleting}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        Confirm Delete
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
