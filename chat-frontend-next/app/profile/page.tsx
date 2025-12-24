"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Camera, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { updateProfile, type UpdateProfileRequest } from "@/lib/api/auth";

export default function ProfilePage() {
    const { isAuthenticated, loading, user, refetchProfile } = useAuth();
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
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
            setFormData({
                username: user.username || "",
                bio: user.bio || "",
            });
        }
    }, [user]);

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);
            setSuccess(false);

            const updateData: UpdateProfileRequest = {};
            if (formData.username !== user?.username) {
                updateData.username = formData.username;
            }
            if (formData.bio !== user?.bio) {
                updateData.bio = formData.bio;
            }

            if (Object.keys(updateData).length > 0) {
                await updateProfile(updateData);
                await refetchProfile();
                setSuccess(true);
            }
        } catch (err: any) {
            console.error("Failed to update profile:", err);
            setError(err.response?.data?.error || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const getInitials = (name: string) => {
        const cleaned = name.replace(/[^a-zA-Z\s]/g, "");
        const words = cleaned.split(" ").filter((word) => word.length > 0);
        if (words.length === 0) {
            return name.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase() || "??";
        }
        return words.map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    };

    if (loading) {
        return (
            <div className="h-screen bg-white flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-black" />
            </div>
        );
    }

    if (!isAuthenticated || !user) return null;

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="border-b border-gray-200 bg-white">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/chat">
                                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-gray-100">
                                    <ArrowLeft className="h-4 w-4 text-gray-600" />
                                </Button>
                            </Link>
                            <h1 className="text-xl font-semibold text-black">Profile</h1>
                        </div>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-black hover:bg-gray-800 text-white"
                        >
                            {saving ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4 mr-2" />
                            )}
                            Save
                        </Button>
                    </div>
                </div>
            </div>

            {/* Profile Content */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    {/* Status Messages */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
                            Profile updated successfully!
                        </div>
                    )}

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
                            <Button
                                size="sm"
                                className="absolute -bottom-1 -right-1 h-8 w-8 p-0 bg-black hover:bg-gray-800 text-white rounded-full"
                            >
                                <Camera className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">{user.email}</p>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Username</label>
                            <Input
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                placeholder="Your username"
                                className="border-gray-200 focus-visible:ring-1 focus-visible:ring-black"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Bio</label>
                            <Textarea
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                placeholder="Tell us about yourself..."
                                rows={4}
                                className="border-gray-200 focus-visible:ring-1 focus-visible:ring-black resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Email</label>
                            <Input
                                value={user.email}
                                disabled
                                className="border-gray-200 bg-gray-50 text-gray-500"
                            />
                            <p className="text-xs text-gray-400">Email cannot be changed</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Role</label>
                            <Input
                                value={user.role}
                                disabled
                                className="border-gray-200 bg-gray-50 text-gray-500 capitalize"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
