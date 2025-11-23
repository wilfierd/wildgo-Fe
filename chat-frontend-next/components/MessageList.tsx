"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { MessageBubble } from "@/components/MessageBubble"
import { groupMessagesByDate, isMessageOwner } from "@/lib/api/messages"
import type { Message } from "@/lib/types"
import { Loader2 } from "lucide-react"

interface MessageListProps {
  messages: Message[]
  currentUserId: number
  loading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  autoScroll?: boolean
  onEdit?: (messageId: number, newContent: string) => Promise<void>
  onDelete?: (messageId: number) => Promise<void>
  onReply?: (message: Message) => void
}

/**
 * MessageList component displays a scrollable list of messages with date separators
 *
 * @param messages - Array of message objects from the API
 * @param currentUserId - Current user's ID to determine message ownership
 * @param loading - Whether messages are currently loading
 * @param hasMore - Whether there are more messages to load
 * @param onLoadMore - Callback to load more messages (pagination)
 * @param autoScroll - Whether to auto-scroll to bottom on new messages (default: true)
 * @param onEdit - Callback when a message is edited
 * @param onDelete - Callback when a message is deleted
 * @param onReply - Callback when user wants to reply to a message
 */
export function MessageList({
  messages,
  currentUserId,
  loading = false,
  hasMore = false,
  onLoadMore,
  autoScroll = true,
  onEdit,
  onDelete,
  onReply,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastMessageIdRef = useRef<number | null>(null)

  // Group messages by date for date separators
  const groupedMessages = groupMessagesByDate(messages)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      // Only scroll if we have a new message
      if (lastMessageIdRef.current !== lastMessage.id) {
        lastMessageIdRef.current = lastMessage.id
        scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
      }
    }
  }, [messages, autoScroll])

  // Check if messages should be grouped (same user, within 5 minutes)
  const shouldGroupWithPrevious = (current: Message, previous: Message | null): boolean => {
    if (!previous) return false
    if (current.user_id !== previous.user_id) return false

    // Check if messages are within 5 minutes of each other
    const currentTime = new Date(current.created_at).getTime()
    const previousTime = new Date(previous.created_at).getTime()
    const diff = currentTime - previousTime
    return diff < 5 * 60 * 1000 // 5 minutes
  }

  return (
    <ScrollArea className="flex-1 bg-gray-50 h-0">
      <div className="p-4 space-y-4">
        {/* Load more button */}
        {hasMore && onLoadMore && (
          <div className="flex justify-center py-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onLoadMore}
              disabled={loading}
              className="bg-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load More'
              )}
            </Button>
          </div>
        )}

        {/* Loading indicator at top */}
        {loading && !hasMore && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        )}

        {/* Empty state */}
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-12 text-center select-none">
            <div className="text-gray-400 mb-2">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">No messages yet</p>
            <p className="text-gray-400 text-xs mt-1">Start the conversation!</p>
          </div>
        )}

        {/* Messages grouped by date */}
        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date} className="space-y-2">
            {/* Date separator */}
            <div className="flex items-center justify-center py-2">
              <div className="bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm select-none">
                <p className="text-xs text-gray-500 font-medium">{date}</p>
              </div>
            </div>

            {/* Messages for this date */}
            {dateMessages.map((message, index) => {
              const previousMessage = index > 0 ? dateMessages[index - 1] : null
              const isOwn = isMessageOwner(message, currentUserId)
              const showAvatar = !shouldGroupWithPrevious(message, previousMessage)

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={isOwn}
                  showAvatar={showAvatar}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onReply={onReply}
                />
              )
            })}
          </div>
        ))}

        {/* Scroll anchor */}
        <div ref={scrollRef} />
      </div>
    </ScrollArea>
  )
}
