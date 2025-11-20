"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface OnlineStatusBadgeProps {
  /**
   * Whether the user is currently online
   */
  isOnline: boolean
  /**
   * Size variant of the badge
   * - sm: 3x3 (12px) - for small avatars in lists
   * - md: 4x4 (16px) - default size
   * - lg: 6x6 (24px) - for large profile avatars
   */
  size?: "sm" | "md" | "lg"
  /**
   * Additional CSS classes
   */
  className?: string
  /**
   * Show gray dot when offline (optional)
   */
  showOffline?: boolean
}

/**
 * OnlineStatusBadge component displays a user's online/offline status
 *
 * Features:
 * - Green dot indicator when user is online
 * - Optional gray dot when offline
 * - Three size variants (sm, md, lg)
 * - Positioned absolutely for overlay on avatars
 * - White border for contrast against avatar backgrounds
 *
 * Usage:
 * ```tsx
 * // Basic usage (small, for DM cards)
 * <OnlineStatusBadge isOnline={user.is_online} size="sm" />
 *
 * // Large, for profile pages
 * <OnlineStatusBadge isOnline={user.online} size="lg" />
 *
 * // Show offline status
 * <OnlineStatusBadge isOnline={user.is_online} showOffline />
 * ```
 *
 * @param isOnline - Whether the user is currently online
 * @param size - Size variant (sm, md, lg)
 * @param className - Additional CSS classes
 * @param showOffline - Whether to show a gray dot when offline
 */
export function OnlineStatusBadge({
  isOnline,
  size = "md",
  className,
  showOffline = false,
}: OnlineStatusBadgeProps) {
  // Don't render anything if offline and showOffline is false
  if (!isOnline && !showOffline) {
    return null
  }

  const sizeClasses = {
    sm: "h-3 w-3 border-2",
    md: "h-4 w-4 border-2",
    lg: "h-6 w-6 border-3",
  }

  const positionClasses = {
    sm: "-bottom-0.5 -right-0.5",
    md: "-bottom-1 -right-1",
    lg: "-bottom-1 -right-1",
  }

  return (
    <div
      className={cn(
        "absolute rounded-full border-white",
        sizeClasses[size],
        positionClasses[size],
        isOnline ? "bg-green-500" : "bg-gray-400",
        className
      )}
      aria-label={isOnline ? "Online" : "Offline"}
      title={isOnline ? "Online" : "Offline"}
    />
  )
}
