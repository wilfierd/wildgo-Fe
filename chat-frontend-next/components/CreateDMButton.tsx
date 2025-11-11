"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { MessageSquarePlus, Search, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
} from "@/components/ui/dialog"
import { getAvailableUsers } from "@/lib/api/users"
import { createDirectRoom } from "@/lib/api/rooms"
import type { User } from "@/lib/types"
import { cn } from "@/lib/utils"

interface CreateDMButtonProps {
  onDMCreated?: (roomId: number) => void
}

/**
 * CreateDMButton component provides a button that opens a dialog to create new direct messages
 *
 * Features:
 * - Search/filter available users
 * - Display user list with avatars
 * - Create or navigate to existing DM
 * - Loading and error states
 * - Elegant, consistent design
 *
 * @param onDMCreated - Callback fired when a DM is created/opened with the room ID
 */
export function CreateDMButton({ onDMCreated }: CreateDMButtonProps) {
  const [open, setOpen] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load available users when dialog opens
  useEffect(() => {
    if (open && users.length === 0) {
      loadUsers()
    }
  }, [open])

  // Filter users based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = users.filter(
        (user) =>
          user.username.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
      )
      setFilteredUsers(filtered)
    }
  }, [searchQuery, users])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const availableUsers = await getAvailableUsers()
      setUsers(availableUsers)
      setFilteredUsers(availableUsers)
    } catch (err) {
      console.error('Failed to load users:', err)
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDM = async (userId: number) => {
    try {
      setCreating(userId)
      setError(null)

      const room = await createDirectRoom(userId)

      // Close dialog and notify parent
      setOpen(false)
      setSearchQuery("")

      if (onDMCreated) {
        onDMCreated(room.id)
      }
    } catch (err: any) {
      console.error('Failed to create DM:', err)
      setError(err.response?.data?.error || 'Failed to create conversation')
    } finally {
      setCreating(null)
    }
  }

  const getInitials = (username: string) => {
    return username
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-8 w-8 p-0 hover:bg-gray-100"
      >
        <MessageSquarePlus className="h-4 w-4 text-gray-600" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)}>
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
            <DialogDescription>
              Start a conversation with someone
            </DialogDescription>
          </DialogHeader>

          <DialogBody>
            {/* Search input */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-50 border-gray-200 focus-visible:ring-1 focus-visible:ring-black"
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* User list */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-sm">
                  {searchQuery ? 'No users found' : 'No available users'}
                </p>
              </div>
            ) : (
              <div className="space-y-1 max-h-[400px] overflow-y-auto">
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleCreateDM(user.id)}
                    disabled={creating === user.id}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg transition-colors",
                      "hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className="bg-gray-100 text-black font-medium border border-gray-200">
                        {getInitials(user.username)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 text-left min-w-0">
                      <p className="font-medium text-black truncate">
                        {user.username}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>

                    {creating === user.id && (
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  )
}
