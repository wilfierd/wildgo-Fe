"use client"

import type React from "react"
import { useState } from "react"
import { MoreVertical, Edit2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Message } from "@/lib/types"
import { EditMessageModal } from "@/components/EditMessageModal"
import { DeleteMessageConfirm } from "@/components/DeleteMessageConfirm"

interface MessageActionsProps {
  message: Message
  isOwn: boolean
  onEdit?: (messageId: number, newContent: string) => Promise<void>
  onDelete?: (messageId: number) => Promise<void>
}

/**
 * MessageActions component displays edit and delete options for messages
 *
 * Features:
 * - Only shows for user's own messages
 * - Dropdown menu on hover/click
 * - Edit and delete actions
 * - Opens respective modals for confirmation
 *
 * @param message - The message object
 * @param isOwn - Whether the message belongs to the current user
 * @param onEdit - Callback when message is edited
 * @param onDelete - Callback when message is deleted
 */
export function MessageActions({ message, isOwn, onEdit, onDelete }: MessageActionsProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Don't show actions for other users' messages
  if (!isOwn) {
    return null
  }

  const handleEdit = async (newContent: string) => {
    if (onEdit) {
      await onEdit(message.id, newContent)
    }
    setShowEditModal(false)
    setShowMenu(false)
  }

  const handleDelete = async () => {
    if (onDelete) {
      await onDelete(message.id)
    }
    setShowDeleteConfirm(false)
    setShowMenu(false)
  }

  return (
    <>
      <div className="relative">
        {/* Actions button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowMenu(!showMenu)}
          className={cn(
            "h-6 w-6 p-0 rounded-full hover:bg-gray-100 transition-opacity",
            "opacity-0 group-hover:opacity-100",
            showMenu && "opacity-100"
          )}
        >
          <MoreVertical className="h-3.5 w-3.5 text-gray-500" />
        </Button>

        {/* Dropdown menu */}
        {showMenu && (
          <>
            {/* Backdrop to close menu */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowMenu(false)}
            />

            {/* Menu */}
            <div className="absolute right-0 top-7 z-20 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[140px]">
              <button
                onClick={() => {
                  setShowEditModal(true)
                  setShowMenu(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Edit2 className="h-3.5 w-3.5" />
                Edit message
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(true)
                  setShowMenu(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete message
              </button>
            </div>
          </>
        )}
      </div>

      {/* Edit modal */}
      <EditMessageModal
        message={message}
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onSave={handleEdit}
      />

      {/* Delete confirmation */}
      <DeleteMessageConfirm
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
      />
    </>
  )
}
