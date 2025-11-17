"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useWebSocket } from '@/hooks/useWebSocket'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessageList } from "@/components/MessageList"
import { MessageInput } from "@/components/MessageInput"
import { DirectMessageCard } from "@/components/DirectMessageCard"
import { CreateDMButton } from "@/components/CreateDMButton"
import { TypingIndicator } from "@/components/TypingIndicator"
import {
  Search,
  MoreVertical,
  Phone,
  Video,
  Settings,
  User,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import type { Room, Message, DirectRoomResponse } from "@/lib/types"
import { getRooms, getDirectRooms, markRoomAsRead } from "@/lib/api/rooms"
import { getMessages, sendMessage, updateMessage, deleteMessage } from "@/lib/api/messages"

export default function ChatPage() {
  const { isAuthenticated, loading: authLoading, user } = useAuth()
  const router = useRouter()

  // State
  const [rooms, setRooms] = useState<Room[]>([])
  const [directRooms, setDirectRooms] = useState<DirectRoomResponse[]>([])
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingRooms, setLoadingRooms] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMoreMessages, setHasMoreMessages] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [replyTo, setReplyTo] = useState<Message | null>(null)

  // WebSocket integration
  const {
    messages: wsMessages,
    isConnected,
    sendTyping,
    clearMessages: clearWsMessages
  } = useWebSocket(selectedRoomId)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, authLoading, router])

  // Load rooms and DMs on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadRoomsAndDMs()
    }
  }, [isAuthenticated])

  // Load messages when room is selected
  useEffect(() => {
    if (selectedRoomId !== null) {
      loadMessagesForRoom(selectedRoomId, 1)
      markAsRead(selectedRoomId)
    }
  }, [selectedRoomId])

  // Append WebSocket messages to the message list
  useEffect(() => {
    if (wsMessages.length > 0) {
      setMessages((prev) => {
        // Filter out duplicates
        const newMessages = wsMessages.filter(
          (wsMsg) => !prev.some((msg) => msg.id === wsMsg.id)
        )
        return [...prev, ...newMessages]
      })

      // Mark room as read when new messages arrive
      if (selectedRoomId) {
        markAsRead(selectedRoomId)
      }
    }
  }, [wsMessages, selectedRoomId])

  // Load rooms and DMs
  const loadRoomsAndDMs = async () => {
    try {
      setLoadingRooms(true)
      setError(null)

      const [roomsData, dmsData] = await Promise.all([
        getRooms(),
        getDirectRooms(),
      ])

      setRooms(roomsData)
      setDirectRooms(dmsData)

      // Auto-select first DM or room if nothing is selected
      if (!selectedRoomId) {
        if (dmsData.length > 0) {
          setSelectedRoomId(dmsData[0].id)
        } else if (roomsData.length > 0) {
          setSelectedRoomId(roomsData[0].id)
        }
      }
    } catch (err) {
      console.error('Failed to load rooms:', err)
      setError('Failed to load conversations')
    } finally {
      setLoadingRooms(false)
    }
  }

  // Load messages for a room
  const loadMessagesForRoom = async (roomId: number, page: number) => {
    try {
      setLoadingMessages(true)
      setError(null)

      const response = await getMessages(roomId, page, 50)

      // Backend returns messages in DESC order (newest first), reverse for display
      const sortedMessages = [...response.messages].reverse()

      if (page === 1) {
        setMessages(sortedMessages)
        clearWsMessages() // Clear WebSocket messages when switching rooms
      } else {
        // Prepend older messages
        setMessages((prev) => [...sortedMessages, ...prev])
      }

      setCurrentPage(page)
      setHasMoreMessages(response.pagination.page < response.pagination.totalPages)
    } catch (err) {
      console.error('Failed to load messages:', err)
      setError('Failed to load messages')
    } finally {
      setLoadingMessages(false)
    }
  }

  // Mark room as read
  const markAsRead = useCallback(async (roomId: number) => {
    try {
      await markRoomAsRead(roomId)
      // Update unread count in the local state
      setDirectRooms((prev) =>
        prev.map((dm) =>
          dm.id === roomId ? { ...dm, unread_count: 0 } : dm
        )
      )
      setRooms((prev) =>
        prev.map((room) =>
          (room as any).id === roomId ? { ...room, unread_count: 0 } : room
        )
      )
    } catch (err) {
      console.error('Failed to mark room as read:', err)
    }
  }, [])

  // Send message (with optional parent_id for threaded replies)
  const handleSendMessage = async (content: string, parentId?: number) => {
    if (!selectedRoomId) return

    try {
      const newMessage = await sendMessage({
        room_id: selectedRoomId,
        content,
        parent_id: parentId,
      })

      // Message will be added via WebSocket broadcast
      // But add it optimistically for immediate feedback
      setMessages((prev) => [...prev, newMessage])

      // Clear reply state after sending
      setReplyTo(null)
    } catch (err) {
      console.error('Failed to send message:', err)
      throw err // Re-throw so MessageInput can handle it
    }
  }

  // Handle reply to message
  const handleReply = useCallback((message: Message) => {
    setReplyTo(message)
  }, [])

  // Cancel reply
  const handleCancelReply = useCallback(() => {
    setReplyTo(null)
  }, [])

  // Handle typing indicator
  const handleTypingChange = useCallback(
    (isTyping: boolean) => {
      if (selectedRoomId) {
        sendTyping(isTyping)
      }
    },
    [selectedRoomId, sendTyping]
  )

  // Edit message
  const handleEditMessage = async (messageId: number, newContent: string) => {
    try {
      const updatedMessage = await updateMessage(messageId, newContent)

      // Update message in the local state
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? updatedMessage : msg))
      )
    } catch (err) {
      console.error('Failed to edit message:', err)
      throw err // Re-throw so component can handle it
    }
  }

  // Delete message
  const handleDeleteMessage = async (messageId: number) => {
    try {
      await deleteMessage(messageId)

      // Remove message from local state
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
    } catch (err) {
      console.error('Failed to delete message:', err)
      throw err // Re-throw so component can handle it
    }
  }

  // Load more messages (pagination)
  const handleLoadMore = () => {
    if (selectedRoomId && !loadingMessages && hasMoreMessages) {
      loadMessagesForRoom(selectedRoomId, currentPage + 1)
    }
  }

  // Get selected room details
  const getSelectedRoom = ():
    | Room
    | DirectRoomResponse
    | null => {
    if (!selectedRoomId) return null

    const directRoom = directRooms.find((dm) => dm.id === selectedRoomId)
    if (directRoom) return directRoom

    return rooms.find((room) => room.id === selectedRoomId) || null
  }

  // Get display name for a room
  const getRoomDisplayName = (room: Room | DirectRoomResponse | null): string => {
    if (!room) return ''

    if ('display_name' in room) {
      return room.display_name
    }

    return room.name
  }

  // Get avatar initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Check if user is online (for DMs)
  const isUserOnline = (room: Room | DirectRoomResponse | null): boolean => {
    if (!room || !('other_user' in room)) return false
    return room.other_user.is_online
  }

  // Get unread count
  const getUnreadCount = (room: Room | DirectRoomResponse): number => {
    if ('unread_count' in room) {
      return room.unread_count
    }
    return 0
  }

  // Filter combined rooms based on search
  const getAllRooms = (): Array<Room | DirectRoomResponse> => {
    const combined = [...directRooms, ...rooms]

    if (!searchQuery.trim()) return combined

    const query = searchQuery.toLowerCase()
    return combined.filter((room) => {
      const name = getRoomDisplayName(room).toLowerCase()
      return name.includes(query)
    })
  }

  const selectedRoom = getSelectedRoom()
  const allRooms = getAllRooms()

  // Loading state
  if (authLoading) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <div className="h-screen bg-white flex">
      {/* Chat List Sidebar */}
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-semibold text-black">Messages</h1>
            <div className="flex items-center gap-2">
              <CreateDMButton
                onDMCreated={(roomId) => {
                  setSelectedRoomId(roomId)
                  loadRoomsAndDMs()
                }}
              />
              <Link href="/profile">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
                  <User className="h-4 w-4 text-gray-600" />
                </Button>
              </Link>
              <Link href="/chat/settings">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
                  <Settings className="h-4 w-4 text-gray-600" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200 focus-visible:ring-1 focus-visible:ring-black text-black placeholder:text-gray-400"
            />
          </div>

          {/* WebSocket connection status */}
          {!isConnected && (
            <div className="mt-2 flex items-center gap-2 text-xs text-amber-600">
              <div className="h-2 w-2 rounded-full bg-amber-600 animate-pulse" />
              <span>Connecting...</span>
            </div>
          )}
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1">
          {loadingRooms ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
              <p className="text-sm text-red-600">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={loadRoomsAndDMs}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          ) : allRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <p className="text-gray-500 text-sm">No conversations yet</p>
              <p className="text-gray-400 text-xs mt-1">Start chatting with someone!</p>
            </div>
          ) : (
            <div className="p-2">
              {allRooms.map((room) => {
                const isSelected = selectedRoomId === room.id

                // Use DirectMessageCard for DMs
                if ('other_user' in room) {
                  return (
                    <DirectMessageCard
                      key={room.id}
                      dm={room}
                      isSelected={isSelected}
                      onClick={() => setSelectedRoomId(room.id)}
                    />
                  )
                }

                // Render group rooms with original inline style
                const displayName = getRoomDisplayName(room)
                const unreadCount = getUnreadCount(room)

                return (
                  <div
                    key={room.id}
                    onClick={() => setSelectedRoomId(room.id)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50",
                      isSelected && "bg-gray-100"
                    )}
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-gray-100 text-black font-medium border border-gray-200">
                          {getInitials(displayName)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-black truncate">{displayName}</h3>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        Group chat
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <div className="bg-black text-white text-xs rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center font-medium">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gray-100 text-black font-medium border border-gray-200">
                      {getInitials(getRoomDisplayName(selectedRoom))}
                    </AvatarFallback>
                  </Avatar>
                  {isUserOnline(selectedRoom) && (
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-black border-2 border-white rounded-full" />
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-black">{getRoomDisplayName(selectedRoom)}</h2>
                  <p className="text-xs text-gray-500">
                    {isUserOnline(selectedRoom) ? 'Active now' : 'Offline'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-gray-100">
                  <Phone className="h-4 w-4 text-gray-600" />
                </Button>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-gray-100">
                  <Video className="h-4 w-4 text-gray-600" />
                </Button>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-gray-100">
                  <MoreVertical className="h-4 w-4 text-gray-600" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <MessageList
              messages={messages}
              currentUserId={user?.id || 0}
              loading={loadingMessages}
              hasMore={hasMoreMessages}
              onLoadMore={handleLoadMore}
              onEdit={handleEditMessage}
              onDelete={handleDeleteMessage}
              onReply={handleReply}
            />

            {/* Typing Indicator */}
            <TypingIndicator roomId={selectedRoomId} />

            {/* Message Input */}
            <MessageInput
              onSend={handleSendMessage}
              onTypingChange={handleTypingChange}
              disabled={!isConnected}
              replyTo={replyTo}
              onCancelReply={handleCancelReply}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="text-gray-400 mb-4">
                <svg
                  className="w-24 h-24 mx-auto"
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
              <h3 className="text-lg font-medium text-gray-900 mb-1">No conversation selected</h3>
              <p className="text-gray-500 text-sm">Choose a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
