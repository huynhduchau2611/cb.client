"use client"

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './auth-context'
import { Message } from './api/chat'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  joinConversation: (conversationId: string) => void
  leaveConversation: (conversationId: string) => void
  sendMessage: (conversationId: string, content: string) => void
  markAsRead: (conversationId: string) => void
  sendTyping: (conversationId: string, isTyping: boolean) => void
  onNewMessage: (callback: (data: { message: Message; conversationId: string }) => void) => void
  onMessageNotification: (callback: (data: { conversationId: string; message: Message }) => void) => void
  onMessagesRead: (callback: (data: { conversationId: string; readBy: string }) => void) => void
  onUserTyping: (callback: (data: { userId: string; conversationId: string; isTyping: boolean }) => void) => void
  onNewConversation: (callback: (data: { conversation: any }) => void) => void
  offNewMessage: (callback: (data: { message: Message; conversationId: string }) => void) => void
  offMessageNotification: (callback: (data: { conversationId: string; message: Message }) => void) => void
  offMessagesRead: (callback: (data: { conversationId: string; readBy: string }) => void) => void
  offUserTyping: (callback: (data: { userId: string; conversationId: string; isTyping: boolean }) => void) => void
  offNewConversation: (callback: (data: { conversation: any }) => void) => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000'

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!user) {
      // Disconnect if user logs out
      if (socketRef.current) {
        socketRef.current.disconnect()
        setSocket(null)
        setIsConnected(false)
      }
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      return
    }

    // Initialize socket connection
    const newSocket = io(SOCKET_URL, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
    })

    newSocket.on('connect', () => {
      setIsConnected(true)
    })

    newSocket.on('disconnect', () => {
      setIsConnected(false)
    })

    newSocket.on('error', (error: any) => {
      // Silent error handling
    })

    newSocket.on('joined_conversation', (data: { conversationId: string }) => {
      // Silent join handling
    })

    setSocket(newSocket)
    socketRef.current = newSocket

    return () => {
      newSocket.disconnect()
      setSocket(null)
      setIsConnected(false)
    }
  }, [user])

  const joinConversation = (conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('join_conversation', { conversationId })
    }
  }

  const leaveConversation = (conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('leave_conversation', { conversationId })
    }
  }

  const sendMessage = (conversationId: string, content: string) => {
    if (socket && isConnected) {
      socket.emit('send_message', { conversationId, content })
    } else {
      throw new Error('Socket is not connected')
    }
  }

  const markAsRead = (conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('mark_read', { conversationId })
    }
  }

  const sendTyping = (conversationId: string, isTyping: boolean) => {
    if (socket && isConnected) {
      socket.emit('typing', { conversationId, isTyping })
    }
  }

  const onNewMessage = (callback: (data: { message: Message; conversationId: string }) => void) => {
    if (socket) {
      socket.on('new_message', callback)
    }
  }

  const onMessageNotification = (callback: (data: { conversationId: string; message: Message }) => void) => {
    if (socket) {
      socket.on('message_notification', callback)
    }
  }

  const onMessagesRead = (callback: (data: { conversationId: string; readBy: string }) => void) => {
    if (socket) {
      socket.on('messages_read', callback)
    }
  }

  const onUserTyping = (callback: (data: { userId: string; conversationId: string; isTyping: boolean }) => void) => {
    if (socket) {
      socket.on('user_typing', callback)
    }
  }

  const offNewMessage = (callback: (data: { message: Message; conversationId: string }) => void) => {
    if (socket) {
      socket.off('new_message', callback)
    }
  }

  const offMessageNotification = (callback: (data: { conversationId: string; message: Message }) => void) => {
    if (socket) {
      socket.off('message_notification', callback)
    }
  }

  const offMessagesRead = (callback: (data: { conversationId: string; readBy: string }) => void) => {
    if (socket) {
      socket.off('messages_read', callback)
    }
  }

  const offUserTyping = (callback: (data: { userId: string; conversationId: string; isTyping: boolean }) => void) => {
    if (socket) {
      socket.off('user_typing', callback)
    }
  }

  const onNewConversation = (callback: (data: { conversation: any }) => void) => {
    if (socket) {
      socket.on('new_conversation', callback)
    }
  }

  const offNewConversation = (callback: (data: { conversation: any }) => void) => {
    if (socket) {
      socket.off('new_conversation', callback)
    }
  }

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinConversation,
        leaveConversation,
        sendMessage,
        markAsRead,
        sendTyping,
        onNewMessage,
        onMessageNotification,
        onMessagesRead,
        onUserTyping,
        onNewConversation,
        offNewMessage,
        offMessageNotification,
        offMessagesRead,
        offUserTyping,
        offNewConversation,
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

