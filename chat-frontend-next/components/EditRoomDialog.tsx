"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
import { updateRoom } from "@/lib/api/rooms"
import type { Room } from "@/lib/api/rooms"

interface EditRoomDialogProps {
  room: Room
  open: boolean
  onOpenChange: (open: boolean) => void
  onRoomUpdated: (room: Room) => void
}

/**
 * EditRoomDialog component allows admins to edit room names
 *
 * Features:
 * - Pre-filled input with current room name
 * - Name validation
 * - Character counter
 * - Save and cancel buttons
 * - Loading state during update
 * - Error handling
 * - Admin-only functionality
 *
 * @param room - The room to edit
 * @param open - Whether the dialog is open
 * @param onOpenChange - Callback to change dialog state
 * @param onRoomUpdated - Callback when room is successfully updated
 */
export function EditRoomDialog({ room, open, onOpenChange, onRoomUpdated }: EditRoomDialogProps) {
  const [roomName, setRoomName] = useState(room.name)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset room name when room changes or dialog opens
  useEffect(() => {
    setRoomName(room.name)
    setError(null)
  }, [room.name, open])

  const handleSave = async () => {
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

    if (trimmedName === room.name) {
      // No changes made
      onOpenChange(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const updatedRoom = await updateRoom(room.id, { name: trimmedName })
      onRoomUpdated(updatedRoom)
      onOpenChange(false)
    } catch (err: any) {
      console.error('Failed to update room:', err)
      setError(err.response?.data?.error || err.message || 'Failed to update room')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setRoomName(room.name)
    setError(null)
    onOpenChange(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Save on Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
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
          <DialogTitle>Edit Room</DialogTitle>
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
                placeholder="Enter room name..."
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
                  Press Enter to save
                </p>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
              <p className="font-medium mb-1">Current room:</p>
              <p className="text-gray-700">{room.name}</p>
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
            onClick={handleSave}
            disabled={loading || !roomName.trim() || roomName.trim() === room.name}
            className="bg-black text-white hover:bg-gray-800"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
