"use client"

import type React from "react"
import { useState } from "react"
import { Loader2 } from "lucide-react"
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
import { createRoom } from "@/lib/api/rooms"
import type { Room } from "@/lib/api/rooms"

interface CreateRoomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRoomCreated: (room: Room) => void
}

/**
 * CreateRoomDialog component allows admins to create new group rooms
 *
 * Features:
 * - Room name input with validation
 * - Character counter
 * - Create and cancel buttons
 * - Loading state during creation
 * - Error handling
 * - Admin-only functionality
 *
 * @param open - Whether the dialog is open
 * @param onOpenChange - Callback to change dialog state
 * @param onRoomCreated - Callback when room is successfully created
 */
export function CreateRoomDialog({ open, onOpenChange, onRoomCreated }: CreateRoomDialogProps) {
  const [roomName, setRoomName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    const trimmedName = roomName.trim()

    // Validation
    if (!trimmedName) {
      setError("Room name cannot be empty")
      return
    }

    if (trimmedName.length < 3) {
      setError("Room name must be at least 3 characters")
      return
    }

    if (trimmedName.length > 50) {
      setError("Room name must be less than 50 characters")
      return
    }

    try {
      setLoading(true)
      setError(null)
      const newRoom = await createRoom({ name: trimmedName })
      onRoomCreated(newRoom)
      setRoomName("")
      onOpenChange(false)
    } catch (err: any) {
      console.error('Failed to create room:', err)
      setError(err.response?.data?.error || err.message || 'Failed to create room')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setRoomName("")
    setError(null)
    onOpenChange(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Create on Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleCreate()
    }
    // Cancel on Escape
    if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={handleCancel}>
        <DialogHeader>
          <DialogTitle>Create New Room</DialogTitle>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-3">
            <div>
              <label htmlFor="room-name" className="block text-sm font-medium text-gray-700 mb-1">
                Room Name
              </label>
              <Input
                id="room-name"
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. General, Random, Tech Talk..."
                disabled={loading}
                className="w-full"
                autoFocus
                maxLength={50}
              />
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-gray-500">
                  {roomName.length}/50 characters
                </p>
                <p className="text-xs text-gray-400">
                  Press Enter to create
                </p>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
              <p className="font-medium mb-1">Note:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Room names must be between 3-50 characters</li>
                <li>All users will be able to see and join this room</li>
                <li>You can edit or delete the room later</li>
              </ul>
            </div>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={handleCancel}
            disabled={loading}
            className="hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={loading || !roomName.trim()}
            className="bg-black text-white hover:bg-gray-800"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating...
              </>
            ) : (
              'Create Room'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
