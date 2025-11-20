"use client"

import type React from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { DirectRoomResponse } from "@/lib/api/rooms"
import { OnlineStatusBadge } from "./OnlineStatusBadge"

interface DirectMessageCardProps {
  dm: DirectRoomResponse
  isSelected?: boolean
  onClick?: () => void
}

/**
 * DirectMessageCard component displays a direct message conversation in the sidebar
 *
 * Features:
 * - Shows other user's avatar with initials
 * - Online status indicator (green dot)
 * - Unread count badge
 * - Last message preview
 * - Responsive hover state
 * - Selected state highlighting
 *
 * @param dm - Direct room data from API
 * @param isSelected - Whether this DM is currently selected
 * @param onClick - Handler for when the card is clicked
 */
export function DirectMessageCard({ dm, isSelected = false, onClick }: DirectMessageCardProps) {
  // Get user initials for avatar
  const getInitials = (username: string) => {
    return username
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Format timestamp for display
  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return ''

    const date = new Date(timestamp)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInMins = Math.floor(diffInMs / 60000)
    const diffInHours = Math.floor(diffInMs / 3600000)
    const diffInDays = Math.floor(diffInMs / 86400000)

    if (diffInMins < 1) return 'Just now'
    if (diffInMins < 60) return `${diffInMins}m ago`
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInDays < 7) return `${diffInDays}d ago`

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50",
        isSelected && "bg-gray-100"
      )}
    >
      {/* Avatar with online status */}
      <div className="relative flex-shrink-0">
        <Avatar className="h-12 w-12">
          <AvatarFallback className="bg-gray-100 text-black font-medium border border-gray-200">
            {getInitials(dm.other_user.username)}
          </AvatarFallback>
        </Avatar>
        <OnlineStatusBadge isOnline={dm.other_user.is_online} size="sm" />
      </div>

      {/* Message info */}
      <div className="flex-1 min-w-0">
        {/* Username and timestamp */}
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-medium text-black truncate">
            {dm.display_name}
          </h3>
          {dm.last_message && (
            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
              {formatTimestamp(dm.last_message.created_at)}
            </span>
          )}
        </div>

        {/* Last message preview */}
        <p className="text-sm text-gray-600 truncate">
          {dm.last_message?.content || 'No messages yet'}
        </p>
      </div>

      {/* Unread count badge */}
      {dm.unread_count > 0 && (
        <div className="bg-black text-white text-xs rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center font-medium flex-shrink-0">
          {dm.unread_count > 99 ? '99+' : dm.unread_count}
        </div>
      )}
    </div>
  )
}
