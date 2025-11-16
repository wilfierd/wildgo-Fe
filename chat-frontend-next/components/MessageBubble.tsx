"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { Message } from "@/lib/types"
import { formatMessageTime } from "@/lib/api/messages"
import { MessageActions } from "@/components/MessageActions"

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  showAvatar?: boolean
  onEdit?: (messageId: number, newContent: string) => Promise<void>
  onDelete?: (messageId: number) => Promise<void>
}

/**
 * MessageBubble component displays a single message in the chat
 *
 * @param message - The message object from the API
 * @param isOwn - Whether the message belongs to the current user
 * @param showAvatar - Whether to show the avatar (useful for grouping)
 * @param onEdit - Callback when message is edited
 * @param onDelete - Callback when message is deleted
 */
export function MessageBubble({ message, isOwn, showAvatar = true, onEdit, onDelete }: MessageBubbleProps) {
  // Get user initials for avatar
  const getInitials = (username: string) => {
    return username
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className={cn("flex gap-3", isOwn ? "justify-end" : "justify-start")}>
      {/* Avatar for other users */}
      {!isOwn && showAvatar && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="bg-gray-100 text-black font-medium border border-gray-200 text-xs">
            {message.user ? getInitials(message.user.username) : 'U'}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Spacer when avatar is hidden for grouping */}
      {!isOwn && !showAvatar && <div className="w-8 flex-shrink-0" />}

      {/* Message content */}
      <div className={cn("max-w-xs lg:max-w-md space-y-1", isOwn && "items-end")}>
        {/* Show username for other users */}
        {!isOwn && showAvatar && message.user && (
          <p className="text-xs text-gray-500 px-1">{message.user.username}</p>
        )}

        {/* Parent message (thread reply) */}
        {message.parent_message && (
          <div className={cn(
            "text-xs px-3 py-1.5 rounded-lg border-l-2 mb-1",
            isOwn
              ? "bg-gray-100 border-gray-400 text-gray-700"
              : "bg-gray-50 border-gray-300 text-gray-600"
          )}>
            <p className="font-medium text-gray-500">
              {message.parent_message.user?.username}
            </p>
            <p className="line-clamp-2">{message.parent_message.content}</p>
          </div>
        )}

        {/* Message bubble with actions */}
        <div className="group relative flex items-start gap-2">
          <div
            className={cn(
              "px-4 py-2 rounded-2xl transition-all duration-200 flex-1",
              isOwn
                ? "bg-black text-white"
                : "bg-white text-black border border-gray-200",
            )}
          >
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
            <div className={cn(
              "flex items-center gap-2 mt-1",
              isOwn && "justify-end"
            )}>
              <p className={cn("text-xs", isOwn ? "text-gray-300" : "text-gray-500")}>
                {formatMessageTime(message.created_at)}
              </p>
              {/* Show edited indicator if message was edited */}
              {message.updated_at !== message.created_at && (
                <span className={cn("text-xs italic", isOwn ? "text-gray-400" : "text-gray-400")}>
                  edited
                </span>
              )}
            </div>
          </div>

          {/* Message actions (edit/delete) */}
          {isOwn && (
            <MessageActions
              message={message}
              isOwn={isOwn}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          )}
        </div>
      </div>
    </div>
  )
}
