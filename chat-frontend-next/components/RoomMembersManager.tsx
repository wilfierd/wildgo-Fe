"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Loader2, UserPlus, X, Search, Shield, Crown, User as UserIcon, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getRoomParticipants, inviteUserToRoom, removeUserFromRoom } from "@/lib/api/rooms"
import { getUsers } from "@/lib/api/users"
import type { Room, ParticipantResponse } from "@/lib/api/rooms"
import type { User } from "@/lib/types"

interface RoomMembersManagerProps {
  room: Room
  currentUserId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * RoomMembersManager component allows admins to manage room members
 *
 * Features:
 * - List all room participants with roles and online status
 * - Search and invite new users to the room
 * - Remove users from the room (with confirmation)
 * - Display user roles (owner, admin, member)
 * - Real-time online status indicators
 * - Loading and error states
 * - Admin-only functionality
 *
 * @param room - The room to manage
 * @param currentUserId - ID of the current user
 * @param open - Whether the dialog is open
 * @param onOpenChange - Callback to change dialog state
 */
export function RoomMembersManager({ room, currentUserId, open, onOpenChange }: RoomMembersManagerProps) {
  const [participants, setParticipants] = useState<ParticipantResponse[]>([])
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [removingUserId, setRemovingUserId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showInviteSection, setShowInviteSection] = useState(false)

  // Load participants when dialog opens
  useEffect(() => {
    if (open) {
      loadParticipants()
    }
  }, [open, room.id])

  // Load available users when invite section is shown
  useEffect(() => {
    if (showInviteSection) {
      loadAvailableUsers()
    }
  }, [showInviteSection])

  const loadParticipants = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getRoomParticipants(room.id)
      setParticipants(data)
    } catch (err: any) {
      console.error('Failed to load participants:', err)
      setError(err.response?.data?.error || err.message || 'Failed to load participants')
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableUsers = async () => {
    try {
      const users = await getUsers()
      // Filter out users who are already participants
      const participantIds = new Set(participants.map(p => p.id))
      const filtered = users.filter(user => !participantIds.has(user.id))
      setAvailableUsers(filtered)
    } catch (err: any) {
      console.error('Failed to load users:', err)
    }
  }

  const handleInviteUser = async (userId: number) => {
    try {
      setInviting(true)
      setError(null)
      await inviteUserToRoom(room.id, { user_id: userId, role: 'member' })
      await loadParticipants()
      setShowInviteSection(false)
      setSearchQuery("")
    } catch (err: any) {
      console.error('Failed to invite user:', err)
      setError(err.response?.data?.error || err.message || 'Failed to invite user')
    } finally {
      setInviting(false)
    }
  }

  const handleRemoveUser = async (userId: number) => {
    try {
      setRemovingUserId(userId)
      setError(null)
      await removeUserFromRoom(room.id, userId)
      await loadParticipants()
    } catch (err: any) {
      console.error('Failed to remove user:', err)
      setError(err.response?.data?.error || err.message || 'Failed to remove user')
    } finally {
      setRemovingUserId(null)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-600" />
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-600" />
      default:
        return <UserIcon className="h-4 w-4 text-gray-500" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800'
      case 'admin':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Filter available users based on search query
  const filteredUsers = availableUsers.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Room Members - {room.name}</DialogTitle>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-4">
            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Current Participants */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900">
                  Current Members ({participants.length})
                </h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowInviteSection(!showInviteSection)}
                  className="text-xs"
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Invite User
                </Button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : (
                <ScrollArea className="h-[300px] border rounded-lg">
                  <div className="p-2 space-y-1">
                    {participants.map((participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-gray-200 text-gray-700 text-sm">
                              {participant.username.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">
                                {participant.username}
                              </span>
                              {participant.id === currentUserId && (
                                <span className="text-xs text-gray-500">(You)</span>
                              )}
                              {participant.is_online && (
                                <span className="h-2 w-2 rounded-full bg-green-500" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(participant.role)}`}>
                                {getRoleIcon(participant.role)}
                                {participant.role}
                              </span>
                              <span className="text-xs text-gray-500">
                                Joined {new Date(participant.joined_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Remove button (only if not current user and not owner) */}
                        {participant.id !== currentUserId && participant.role.toLowerCase() !== 'owner' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveUser(participant.id)}
                            disabled={removingUserId === participant.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {removingUserId === participant.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    ))}

                    {participants.length === 0 && !loading && (
                      <div className="text-center py-8 text-sm text-gray-500">
                        No members found
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Invite Section */}
            {showInviteSection && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Invite Users to Room
                </h3>

                <div className="mb-3">
                  <Input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                    icon={<Search className="h-4 w-4 text-gray-400" />}
                  />
                </div>

                <ScrollArea className="h-[200px] border rounded-lg">
                  <div className="p-2 space-y-1">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-gray-200 text-gray-700 text-sm">
                              {user.username.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {user.username}
                            </p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => handleInviteUser(user.id)}
                          disabled={inviting}
                          className="bg-black text-white hover:bg-gray-800"
                        >
                          {inviting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Invite'
                          )}
                        </Button>
                      </div>
                    ))}

                    {filteredUsers.length === 0 && (
                      <div className="text-center py-8 text-sm text-gray-500">
                        {searchQuery ? 'No users found matching your search' : 'No available users to invite'}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </DialogBody>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="hover:bg-gray-100"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
