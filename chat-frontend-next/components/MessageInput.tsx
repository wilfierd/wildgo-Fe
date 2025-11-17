"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Smile, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Message } from "@/lib/types"

interface MessageInputProps {
  onSend: (content: string, parentId?: number) => Promise<void> | void
  placeholder?: string
  disabled?: boolean
  onTypingChange?: (isTyping: boolean) => void
  replyTo?: Message | null
  onCancelReply?: () => void
}

/**
 * MessageInput component for sending messages
 *
 * @param onSend - Callback when user sends a message (content, optional parentId)
 * @param placeholder - Input placeholder text
 * @param disabled - Whether input is disabled
 * @param onTypingChange - Callback when typing state changes (for typing indicators)
 * @param replyTo - Message being replied to (for threaded replies)
 * @param onCancelReply - Callback to cancel reply mode
 */
export function MessageInput({
  onSend,
  placeholder = "Type a message...",
  disabled = false,
  onTypingChange,
  replyTo = null,
  onCancelReply,
}: MessageInputProps) {
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)

  // Handle typing indicator
  const handleTyping = useCallback(
    (value: string) => {
      setMessage(value)

      if (!onTypingChange) return

      // Clear existing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout)
      }

      // User is typing
      if (value.trim().length > 0) {
        onTypingChange(true)

        // Set timeout to stop typing indicator after 3 seconds
        const timeout = setTimeout(() => {
          onTypingChange(false)
        }, 3000)
        setTypingTimeout(timeout)
      } else {
        // User stopped typing (empty input)
        onTypingChange(false)
      }
    },
    [onTypingChange, typingTimeout]
  )

  // Handle sending message
  const handleSend = async () => {
    const trimmedMessage = message.trim()
    if (!trimmedMessage || sending || disabled) return

    try {
      setSending(true)

      // Stop typing indicator
      if (onTypingChange) {
        onTypingChange(false)
      }
      if (typingTimeout) {
        clearTimeout(typingTimeout)
      }

      // Send message with optional parent_id for threaded replies
      await onSend(trimmedMessage, replyTo?.id)

      // Clear input and reply state
      setMessage("")
      if (onCancelReply) {
        onCancelReply()
      }
    } catch (error) {
      console.error("Failed to send message:", error)
      // Keep the message in the input so user can retry
    } finally {
      setSending(false)
    }
  }

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="p-4 border-t border-gray-200 bg-white">
      {/* Reply preview */}
      {replyTo && (
        <div className="mb-2 flex items-start gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 font-medium mb-0.5">
              Replying to {replyTo.user?.username || 'User'}
            </p>
            <p className="text-sm text-gray-700 truncate">{replyTo.content}</p>
          </div>
          {onCancelReply && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancelReply}
              className="h-6 w-6 p-0 hover:bg-gray-200 flex-shrink-0"
              type="button"
            >
              <X className="h-3.5 w-3.5 text-gray-500" />
            </Button>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Emoji button (placeholder for future emoji picker) */}
        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-10 p-0 hover:bg-gray-100 flex-shrink-0"
          disabled={disabled}
          type="button"
        >
          <Smile className="h-4 w-4 text-gray-600" />
        </Button>

        {/* Message input */}
        <Input
          value={message}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1 bg-gray-50 border-gray-200 focus-visible:ring-1 focus-visible:ring-black text-black placeholder:text-gray-400"
          disabled={disabled || sending}
        />

        {/* Send button */}
        <Button
          onClick={handleSend}
          size="sm"
          className={cn(
            "h-10 w-10 p-0 flex-shrink-0 transition-colors",
            message.trim()
              ? "bg-black hover:bg-gray-800 text-white"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          )}
          disabled={!message.trim() || sending || disabled}
          type="button"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Character count (optional, shows when approaching limit) */}
      {message.length > 1900 && (
        <div className="mt-1 text-right">
          <p
            className={cn(
              "text-xs",
              message.length > 2000 ? "text-red-500" : "text-gray-500"
            )}
          >
            {message.length} / 2000
          </p>
        </div>
      )}
    </div>
  )
}
