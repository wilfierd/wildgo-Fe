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
import type { Message } from "@/lib/types"

interface EditMessageModalProps {
  message: Message
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (newContent: string) => Promise<void>
}

/**
 * EditMessageModal component allows users to edit their messages
 *
 * Features:
 * - Pre-filled textarea with current message content
 * - Character counter
 * - Save and cancel buttons
 * - Loading state during save
 * - Error handling
 *
 * @param message - The message to edit
 * @param open - Whether the modal is open
 * @param onOpenChange - Callback to change modal state
 * @param onSave - Callback to save the edited message
 */
export function EditMessageModal({ message, open, onOpenChange, onSave }: EditMessageModalProps) {
  const [content, setContent] = useState(message.content)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset content when message changes
  useEffect(() => {
    setContent(message.content)
    setError(null)
  }, [message.content, open])

  const handleSave = async () => {
    const trimmedContent = content.trim()

    // Validation
    if (!trimmedContent) {
      setError("Message cannot be empty")
      return
    }

    if (trimmedContent === message.content) {
      // No changes made
      onOpenChange(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      await onSave(trimmedContent)
      onOpenChange(false)
    } catch (err: any) {
      console.error('Failed to edit message:', err)
      setError(err.message || 'Failed to edit message')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setContent(message.content)
    setError(null)
    onOpenChange(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Save on Ctrl/Cmd + Enter
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
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
          <DialogTitle>Edit Message</DialogTitle>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-3">
            <div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                disabled={loading}
                className="w-full min-h-[120px] px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                autoFocus
              />
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-gray-500">
                  {content.length} characters
                </p>
                <p className="text-xs text-gray-400">
                  Ctrl+Enter to save
                </p>
              </div>
            </div>

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
            onClick={handleSave}
            disabled={loading || !content.trim()}
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
