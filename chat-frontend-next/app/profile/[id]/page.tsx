"use client"

import { useEffect, use, useState } from "react"
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, MessageCircle, Phone, Video, Mail, Calendar } from "lucide-react"
import Link from "next/link"
import { getUserById } from "@/lib/api/users"
import type { User } from "@/lib/types"
export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { isAuthenticated, loading, user } = useAuth();
    const router = useRouter();
    const { id } = use(params);
    const [userData, setUserData] = useState<User | null>(null);
    const [fetchingUser, setFetchingUser] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, loading, router]);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!id) return;

            try {
                setFetchingUser(true);
                setError(null);
                const userProfile = await getUserById(parseInt(id));
                setUserData(userProfile);
            } catch (err: any) {
                console.error('Failed to fetch user profile:', err);
                setError(err.response?.data?.error || 'Failed to load user profile');
            } finally {
                setFetchingUser(false);
            }
        };

        if (isAuthenticated && !loading) {
            fetchUserData();
        }
    }, [id, isAuthenticated, loading]);

    if (loading || fetchingUser) {
        return (
            <div className="h-screen bg-white flex items-center justify-center">
                <div className="text-black">Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    if (error) {
        return (
            <div className="h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <Link href="/chat">
                        <Button className="bg-black hover:bg-gray-800 text-white">
                            Back to Chat
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    if (!userData) return null;

    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="border-b border-gray-200 bg-white">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Link href="/chat">
                            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-gray-100">
                                <ArrowLeft className="h-4 w-4 text-gray-600" />
                            </Button>
                        </Link>
                        <h1 className="text-xl font-semibold text-black">{userData.username}</h1>
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
                                <AvatarFallback className="bg-gray-100 text-black text-2xl font-medium">
                                    {getInitials(userData.username)}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                        <h2 className="text-2xl font-semibold text-black mt-4">{userData.username}</h2>
                        <p className="text-sm text-gray-500 mt-2">@{userData.username}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-center gap-3 mb-8">
                        <Link href="/chat">
                            <Button className="bg-black hover:bg-gray-800 text-white">
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Message
                            </Button>
                        </Link>
                        <Button variant="outline" className="border-gray-200 hover:bg-gray-50 bg-transparent">
                            <Phone className="h-4 w-4 mr-2" />
                            Call
                        </Button>
                        <Button variant="outline" className="border-gray-200 hover:bg-gray-50 bg-transparent">
                            <Video className="h-4 w-4 mr-2" />
                            Video
                        </Button>
                    </div>

                    {/* Profile Details */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    Email
                                </label>
                                <p className="text-black">{userData.email}</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Joined
                                </label>
                                <p className="text-black">
                                    {new Date(userData.created_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>

                            {userData.role && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">
                                        Role
                                    </label>
                                    <p className="text-black capitalize">{userData.role}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
