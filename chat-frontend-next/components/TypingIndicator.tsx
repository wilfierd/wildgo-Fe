"use client"

import type React from "react"
import { useTypingIndicator } from "@/hooks/useWebSocket"
import { useAuth } from "@/hooks/useAuth"

interface TypingIndicatorProps {
  roomId: number | null
}

/**
 * TypingIndicator component displays when users are typing in a room
 *
 * Features:
 * - Shows "X users typing..." message
 * - Uses the useTypingIndicator hook for real-time updates
 * - Animated dots to indicate activity
 * - Automatically hides when no one is typing
 *
 * @param roomId - Room ID to monitor for typing activity
 *
 * @example
 * ```tsx
 * <TypingIndicator roomId={selectedRoomId} />
 * ```
 */
export function TypingIndicator({ roomId }: TypingIndicatorProps) {
  const { user } = useAuth()
  const typingUsers = useTypingIndicator(roomId, user?.id)

  // Don't show if no one is typing
  if (typingUsers.length === 0) {
    return null
  }

  // Format the typing message based on number of users
  const getTypingMessage = () => {
    const count = typingUsers.length
    if (count === 1) {
      return "Someone is typing"
    } else if (count === 2) {
      return "2 people are typing"
    } else {
      return `${count} people are typing`
    }
  }

  return (
    <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>{getTypingMessage()}</span>
        <div className="flex gap-1">
          <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
          <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
          <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
        </div>
      </div>
    </div>
  )
}
