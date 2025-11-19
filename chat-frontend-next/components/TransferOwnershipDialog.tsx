"use client"

import type React from "react"
import { useState } from "react"
import { Loader2, AlertTriangle, Crown } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { transferRoomOwnership } from "@/lib/api/rooms"
import type { Room, ParticipantResponse } from "@/lib/api/rooms"

interface TransferOwnershipDialogProps {
  room: Room
  participant: ParticipantResponse
  open: boolean
  onOpenChange: (open: boolean) => void
  onTransferred: () => void
}

/**
 * TransferOwnershipDialog component for transferring room ownership
 *
 * Features:
 * - Shows warning about permanent action
 * - Displays new owner information
 * - Explains consequences (current owner becomes admin)
 * - Confirmation required
 * - Loading and error states
 * - Owner-only functionality
 *
 * @param room - The room to transfer ownership of
 * @param participant - The user who will become the new owner
 * @param open - Whether the dialog is open
 * @param onOpenChange - Callback to change dialog state
 * @param onTransferred - Callback when ownership is successfully transferred
 */
export function TransferOwnershipDialog({
  room,
  participant,
  open,
  onOpenChange,
  onTransferred,
}: TransferOwnershipDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  const handleTransfer = async () => {
    if (!confirmed) {
      setError("Please confirm that you understand this action")
      return
    }

    try {
      setLoading(true)
      setError(null)
      await transferRoomOwnership(room.id, participant.id)
      onTransferred()
      onOpenChange(false)
      setConfirmed(false)
    } catch (err: any) {
      console.error('Failed to transfer ownership:', err)
      setError(err.response?.data?.error || err.message || 'Failed to transfer ownership')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setConfirmed(false)
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={handleCancel}>
        <DialogHeader>
          <DialogTitle>Transfer Room Ownership</DialogTitle>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-4">
            {/* Warning */}
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900">
                  This is a permanent action!
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  You will lose owner privileges and become an admin. Only the new owner can transfer ownership again.
                </p>
              </div>
            </div>

            {/* New Owner Info */}
            <div className="border rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-3">New Owner:</p>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-gray-200 text-gray-700">
                    {participant.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      {participant.username}
                    </span>
                    {participant.is_online && (
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    Current role: {participant.role}
                  </p>
                </div>
              </div>
            </div>

            {/* Consequences */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-900 mb-2">What will happen:</p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li className="flex items-start gap-2">
                  <Crown className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <span><strong>{participant.username}</strong> will become the owner</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 text-xs mt-0.5">→</span>
                  <span>You will become an admin</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 text-xs mt-0.5">→</span>
                  <span>Only the new owner can transfer ownership</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 text-xs mt-0.5">→</span>
                  <span>This action cannot be undone</span>
                </li>
              </ul>
            </div>

            {/* Confirmation Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
              />
              <span className="text-sm text-gray-700">
                I understand that this action is permanent and I will lose owner privileges
              </span>
            </label>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}
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
            onClick={handleTransfer}
            disabled={loading || !confirmed}
            className="bg-amber-600 text-white hover:bg-amber-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Transferring...
              </>
            ) : (
              'Transfer Ownership'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
