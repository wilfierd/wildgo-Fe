"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Mail,
  Calendar,
  Shield,
  Github,
  Edit,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { OnlineStatusBadge } from "@/components/OnlineStatusBadge";
import { updateProfile } from "@/lib/api/auth";

export default function ProfilePage() {
  const { isAuthenticated, loading, user, refetchProfile } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    username: "",
    bio: "",
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (user) {
      setEditForm({
        username: user.username || "",
        bio: user.bio || "",
      });
    }
  }, [user]);

  if (loading) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="text-black">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  const getInitials = (name: string) => {
    const cleaned = name.replace(/[^a-zA-Z\s]/g, "");
    const words = cleaned.split(" ").filter((word) => word.length > 0);
    if (words.length === 0) {
      return (
        name
          .replace(/[^a-zA-Z]/g, "")
          .slice(0, 2)
          .toUpperCase() || "??"
      );
    }
    return words
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatJoinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await updateProfile({
        username: editForm.username,
        bio: editForm.bio,
      });
      await refetchProfile();
      setIsEditing(false);
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      setError(err.response?.data?.error || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm({
      username: user.username || "",
      bio: user.bio || "",
    });
    setError(null);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/chat">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4 text-gray-600" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold text-black">My Profile</h1>
            <div className="ml-auto">
              {!isEditing && (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="ghost"
                  size="sm"
                  className="hover:bg-gray-100"
                >
                  <Edit className="h-4 w-4 mr-2 text-gray-600" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <Avatar className="h-24 w-24 border-2 border-gray-200">
                {user.avatar_url && (
                  <AvatarImage src={user.avatar_url} alt={user.username} />
                )}
                <AvatarFallback className="bg-gray-100 text-black text-2xl font-medium">
                  {getInitials(user.username)}
                </AvatarFallback>
              </Avatar>
              <OnlineStatusBadge isOnline={user.is_online ?? true} size="lg" />
            </div>
            <h2 className="text-2xl font-semibold text-black mt-4">
              {user.username}
            </h2>
            <p className="text-sm text-gray-500 mt-1">@{user.username}</p>
            {user.bio && !isEditing && (
              <p className="text-gray-600 mt-3 text-center max-w-md">
                {user.bio}
              </p>
            )}
            <div className="flex gap-2 mt-2">
              {user.role === "admin" && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-black text-white">
                  <Shield className="h-3 w-3 mr-1" />
                  Admin
                </span>
              )}
              {user.provider === "github" && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-white">
                  <Github className="h-3 w-3 mr-1" />
                  GitHub
                </span>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Edit Form */}
          {isEditing && (
            <div className="mb-8 space-y-4 border-b border-gray-200 pb-8">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  Username
                </label>
                <Input
                  value={editForm.username}
                  onChange={(e) =>
                    setEditForm({ ...editForm, username: e.target.value })
                  }
                  placeholder="Enter your username"
                  className="bg-gray-50 border-gray-200 focus-visible:ring-black"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Bio</label>
                <Textarea
                  value={editForm.bio}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEditForm({ ...editForm, bio: e.target.value })
                  }
                  placeholder="Tell us about yourself..."
                  className="bg-gray-50 border-gray-200 focus-visible:ring-black min-h-[100px]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="hover:bg-gray-100"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-black hover:bg-gray-800 text-white"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}

          {/* Profile Details */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <p className="text-black">{user.email}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Joined
                </label>
                <p className="text-black">{formatJoinDate(user.created_at)}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Role
                </label>
                <p className="text-black capitalize">{user.role}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  User ID
                </label>
                <p className="text-black">#{user.id}</p>
              </div>

              {user.status && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <p className="text-black capitalize">{user.status}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
