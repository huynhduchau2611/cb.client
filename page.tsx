"use client"

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { flushSync } from 'react-dom'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Send, MessageCircle, Search, Loader2, Briefcase, MessageSquare } from 'lucide-react'
import { useSocket } from '@/lib/socket-context'
import { chatApi, Conversation, Message } from '@/lib/api/chat'
import { useAuth } from '@/lib/auth-context'
import { useNotification } from '@/lib/notification-context'
import { formatDistanceToNow, format, isThisWeek, differenceInDays } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export default function ChatPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const { showError } = useNotification()
  const { socket, isConnected, joinConversation, leaveConversation, sendMessage, markAsRead, sendTyping, onNewMessage, offNewMessage, onMessageNotification, offMessageNotification, onUserTyping, offUserTyping, onNewConversation, offNewConversation } = useSocket()
  
  // Store markAsRead in ref to use in event handlers (already handled above)
  
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [loadingOldMessages, setLoadingOldMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const [userOnlineStatus, setUserOnlineStatus] = useState<{ isOnline: boolean; lastSeen: string | null } | null>(null)
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false)
  const [showLoadMoreButton, setShowLoadMoreButton] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastTypingSentRef = useRef<number>(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesScrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesViewportRef = useRef<HTMLElement | null>(null)
  const isInitialLoadRef = useRef(true)
  const previousMessagesLengthRef = useRef(0)
  const scrollPositionRef = useRef<number | null>(null)
  const isUserAtBottomRef = useRef(true)
  const selectedConversationIdRef = useRef<string | null>(null)
  const scrollToBottomRef = useRef<() => void>(() => {})

  const conversationIdFromUrl = searchParams.get('conversationId')

  // Track initialization to prevent reloading on conversations update
  const hasInitializedRef = useRef(false)
  const prevConversationIdFromUrlRef = useRef<string | null>(null)
  const hasReloadedForConversationRef = useRef<string | null>(null)
  const [reloadTrigger, setReloadTrigger] = useState(0)
  
  // Define loadConversations with useCallback so it can be called from anywhere
  const loadConversations = useCallback(async () => {
    try {
      setLoading(true)
      const data = await chatApi.getConversations()
      setConversations(data)
      
      // Calculate unread counts from lastMessage
      const counts: Record<string, number> = {}
      data.forEach(conv => {
        // Check if last message is from other user and not read
        if (conv.lastMessage && conv.lastMessage.sender._id !== user?.id && !conv.lastMessage.isRead) {
          counts[conv._id] = 1 // At least 1 unread
        } else {
          counts[conv._id] = 0
        }
      })
      setUnreadCounts(counts)
    } catch (error: any) {
      showError('Lỗi', error.message || 'Không thể tải danh sách cuộc trò chuyện')
    } finally {
      setLoading(false)
    }
  }, [user?.id, showError])
  
  // Load conversations on mount only
  useEffect(() => {
    loadConversations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount
  
  // Handle reload when conversationId from URL is not found
  useEffect(() => {
    // Only reload if conversationId is in URL, not in list, and we haven't reloaded for this conversation yet
    if (conversationIdFromUrl && 
        conversations.length > 0 && 
        !conversations.find(c => c._id === conversationIdFromUrl) &&
        hasReloadedForConversationRef.current !== conversationIdFromUrl &&
        !loading) {
      console.log('Conversation not found in list, reloading conversations...')
      hasReloadedForConversationRef.current = conversationIdFromUrl
      setReloadTrigger(prev => prev + 1)
    }
  }, [conversationIdFromUrl, conversations, loading])
  
  // Reload conversations when reloadTrigger changes (but only once per trigger)
  useEffect(() => {
    if (reloadTrigger > 0) {
      loadConversations()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadTrigger]) // Only depend on reloadTrigger, not loadConversations to avoid loop
  
  // Handle conversation selection from URL - restore on page load
  useEffect(() => {
    // Only proceed if we have conversations loaded
    if (conversations.length === 0 || loading) return
    
    // If URL has conversationId, try to select it
    if (conversationIdFromUrl) {
      const conv = conversations.find(c => c._id === conversationIdFromUrl)
      if (conv) {
        // Check if this is a new selection (URL changed or not yet selected)
        const isNewSelection = !selectedConversation || selectedConversation._id !== conversationIdFromUrl
        const isUrlChange = conversationIdFromUrl !== prevConversationIdFromUrlRef.current
        
        if (isNewSelection || isUrlChange) {
          setSelectedConversation(conv)
          prevConversationIdFromUrlRef.current = conversationIdFromUrl
          hasInitializedRef.current = true
          // Reset reload flag if conversation is found
          if (hasReloadedForConversationRef.current === conversationIdFromUrl) {
            hasReloadedForConversationRef.current = null
          }
        }
        return
      }
      // If conversation not found, the reload effect above will handle it
      return
    }
    
    // Only auto-select on first load if no conversation is selected and no URL param
    if (!hasInitializedRef.current && !selectedConversation && !conversationIdFromUrl) {
      // Auto-select first conversation
      if (conversations.length > 0) {
        setSelectedConversation(conversations[0])
        hasInitializedRef.current = true
      }
    }
  }, [conversations, conversationIdFromUrl, loading, selectedConversation])

  // Store functions in refs to avoid dependencies
  const joinConversationRef = useRef(joinConversation)
  const leaveConversationRef = useRef(leaveConversation)
  const markAsReadRef = useRef(markAsRead)
  
  useEffect(() => {
    joinConversationRef.current = joinConversation
    leaveConversationRef.current = leaveConversation
    markAsReadRef.current = markAsRead
  }, [joinConversation, leaveConversation, markAsRead])

  // Load messages when conversation is selected
  const loadMessagesRef = useRef<((convId: string, page: number, append: boolean) => Promise<void>) | null>(null)
  const lastLoadedConversationIdRef = useRef<string | null>(null)
  
  useEffect(() => {
    if (selectedConversation && 
        loadMessagesRef.current && 
        selectedConversation._id !== lastLoadedConversationIdRef.current) {
      lastLoadedConversationIdRef.current = selectedConversation._id
      loadMessagesRef.current(selectedConversation._id, 1, false)
    }
  }, [selectedConversation?._id])

  // Join conversation room when selected
  useEffect(() => {
    if (selectedConversation && isConnected) {
      const conversationId = selectedConversation._id
      joinConversationRef.current(conversationId)
      markAsReadRef.current(conversationId)
      return () => {
        leaveConversationRef.current(conversationId)
      }
    }
  }, [selectedConversation?._id, isConnected]) // Only depend on IDs, not functions

  // Fetch user online status when conversation is selected
  useEffect(() => {
    if (!selectedConversation) {
      setUserOnlineStatus(null)
      return
    }

    const otherUser = getOtherUser(selectedConversation)
    if (!otherUser?._id) return

    const fetchOnlineStatus = async () => {
      try {
        const status = await chatApi.getUserOnlineStatus(otherUser._id)
        setUserOnlineStatus(status)
      } catch (error) {
        // Silent fail, use default
        setUserOnlineStatus({ isOnline: false, lastSeen: null })
      }
    }

    fetchOnlineStatus()
    // Refresh status every 30 seconds
    const interval = setInterval(fetchOnlineStatus, 30000)
    return () => clearInterval(interval)
  }, [selectedConversation])


  // Listen for new messages - use refs to avoid dependencies
  useEffect(() => {
    const handleNewMessage = (data: { message: Message; conversationId: string }) => {
      const isCurrentConversation = data.conversationId === selectedConversationIdRef.current
      const isFromOther = data.message.sender._id !== user?.id
      
      // If user is viewing this conversation, automatically mark as read
      if (isCurrentConversation && isFromOther && !data.message.isRead) {
        markAsReadRef.current(data.conversationId)
        // Update message to be marked as read
        data.message.isRead = true
      }
      
      // Check if this message is for current conversation
      if (isCurrentConversation) {
        const shouldScroll = isUserAtBottomRef.current
        
        // Update messages - replace optimistic message if exists
        setMessages((prev) => {
          // Remove optimistic message if exists (replace with real one)
          const filtered = prev.filter((msg) => !msg._id.startsWith('temp-'))
          const newMessages = [...filtered, data.message]
          previousMessagesLengthRef.current = newMessages.length
          
          // Scroll to bottom only if user was at bottom - use ref function
          if (shouldScroll) {
            // Use next tick to scroll after DOM update
            setTimeout(() => {
              scrollToBottomRef.current()
            }, 0)
          }
          
          return newMessages
        })
      }
      
      // Update only the specific conversation in the list, don't reload all
      setConversations((prev) => {
        return prev.map((conv) => {
          if (conv._id === data.conversationId) {
            // If user is viewing this conversation, mark lastMessage as read
            const updatedMessage = isCurrentConversation && isFromOther 
              ? { ...data.message, isRead: true }
              : data.message
            return {
              ...conv,
              lastMessage: updatedMessage,
              lastMessageAt: new Date().toISOString(),
            }
          }
          return conv
        }).sort((a, b) => {
          // Sort by lastMessageAt
          const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
          const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
          return bTime - aTime
        })
      })
      
      // Update unread count for the conversation
      // Only increment if not viewing the conversation or if message is not from other user
      if (isFromOther && !data.message.isRead && !isCurrentConversation) {
        setUnreadCounts((prev) => ({
          ...prev,
          [data.conversationId]: (prev[data.conversationId] || 0) + 1,
        }))
      } else if (isCurrentConversation) {
        // Clear unread count if viewing the conversation
        setUnreadCounts((prev) => ({
          ...prev,
          [data.conversationId]: 0,
        }))
      }
    }

    const handleNotification = (data: { conversationId: string; message: Message }) => {
      const isCurrentConversation = data.conversationId === selectedConversationIdRef.current
      const isFromOther = data.message.sender._id !== user?.id
      
      // If user is viewing this conversation, automatically mark as read
      if (isCurrentConversation && isFromOther && !data.message.isRead) {
        markAsReadRef.current(data.conversationId)
        // Update message to be marked as read
        data.message.isRead = true
      }
      
      // Update only the specific conversation in the list
      setConversations((prev) => {
        return prev.map((conv) => {
          if (conv._id === data.conversationId) {
            // If user is viewing this conversation, mark lastMessage as read
            const updatedMessage = isCurrentConversation && isFromOther 
              ? { ...data.message, isRead: true }
              : data.message
            return {
              ...conv,
              lastMessage: updatedMessage,
              lastMessageAt: new Date().toISOString(),
            }
          }
          return conv
        }).sort((a, b) => {
          const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
          const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
          return bTime - aTime
        })
      })
      
      // Update unread count for the conversation
      // Only increment if not viewing the conversation or if message is not from other user
      if (isFromOther && !data.message.isRead && !isCurrentConversation) {
        setUnreadCounts((prev) => ({
          ...prev,
          [data.conversationId]: (prev[data.conversationId] || 0) + 1,
        }))
      } else if (isCurrentConversation) {
        // Clear unread count if viewing the conversation
        setUnreadCounts((prev) => ({
          ...prev,
          [data.conversationId]: 0,
        }))
      }
    }

    const handleUserTyping = (data: { userId: string; conversationId: string; isTyping: boolean }) => {
      // Only show typing if it's for the current conversation and not from current user
      if (data.conversationId === selectedConversationIdRef.current && data.userId !== user?.id) {
        setIsOtherUserTyping(data.isTyping)
        
        // Auto-hide typing indicator after 3 seconds if no new typing event
        if (data.isTyping) {
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
          }
          typingTimeoutRef.current = setTimeout(() => {
            setIsOtherUserTyping(false)
          }, 3000)
        }
      }
    }

    // Listen for new conversations
    const handleNewConversation = (data: { conversation: Conversation }) => {
      console.log('Received new_conversation event:', data)
      // Check if this conversation is for the current user
      const conversationUserIds = data.conversation.users.map((u: any) => String(u._id || u))
      const currentUserId = String(user?.id || '')
      console.log('Conversation user IDs:', conversationUserIds, 'Current user ID:', currentUserId)
      
      if (conversationUserIds.includes(currentUserId)) {
        console.log('Adding new conversation to list:', data.conversation._id)
        // Add conversation to list if it doesn't exist
        setConversations((prev) => {
          // Check if conversation already exists
          const exists = prev.some(conv => conv._id === data.conversation._id)
          if (exists) {
            console.log('Conversation already exists, skipping')
            return prev
          }
          
          console.log('Adding new conversation to list')
          // Add new conversation to the beginning of the list
          const updated = [data.conversation, ...prev]
          
          // Sort by lastMessageAt (most recent first)
          return updated.sort((a, b) => {
            const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
            const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
            return bTime - aTime
          })
        })
      } else {
        console.log('Conversation is not for current user, ignoring')
      }
    }

    onNewMessage(handleNewMessage)
    onMessageNotification(handleNotification)
    onUserTyping(handleUserTyping)
    onNewConversation(handleNewConversation)

    return () => {
      offNewMessage(handleNewMessage)
      offMessageNotification(handleNotification)
      offUserTyping(handleUserTyping)
      offNewConversation(handleNewConversation)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [onNewMessage, offNewMessage, onMessageNotification, offMessageNotification, onUserTyping, offUserTyping, onNewConversation, offNewConversation, user?.id])

  // Don't use useLayoutEffect for scroll - handled directly in handleNewMessage
  // This prevents any scroll jumping

  const loadMessages = useCallback(async (convId: string, page: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingOldMessages(true)
      } else {
        setLoadingMessages(true)
        isInitialLoadRef.current = true
        setCurrentPage(1)
        setHasMoreMessages(true)
      }

      const data = await chatApi.getMessages(convId, page, 50)
      
      if (append) {
        // Append old messages to the beginning
        setMessages((prev) => {
          const newMessages = [...data, ...prev]
          previousMessagesLengthRef.current = newMessages.length
          return newMessages
        })
        
        // Check if there are more messages to load
        if (data.length < 50) {
          setHasMoreMessages(false)
        }
      } else {
        // Replace messages (initial load)
        setMessages(data)
        previousMessagesLengthRef.current = data.length
        
        // Check if there are more messages to load
        if (data.length < 50) {
          setHasMoreMessages(false)
        }
        
        // Scroll to bottom on initial load to show latest messages
        setTimeout(() => {
          scrollToBottomRef.current()
          isInitialLoadRef.current = false
        }, 200)
      }
    } catch (error: any) {
      showError('Lỗi', error.message || 'Không thể tải tin nhắn')
    } finally {
      if (append) {
        setLoadingOldMessages(false)
      } else {
        setLoadingMessages(false)
      }
    }
  }, [showError])
  
  // Update loadMessages ref
  useEffect(() => {
    loadMessagesRef.current = loadMessages
  }, [loadMessages])

  const loadOldMessages = useCallback(async () => {
    const convId = selectedConversationIdRef.current
    if (!convId || loadingOldMessages || !hasMoreMessages) return

    const nextPage = currentPage + 1
    const viewport = messagesViewportRef.current || (() => {
      const messagesScrollArea = document.querySelector('[data-chat-messages="true"]')
      return messagesScrollArea?.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement
    })()
    
    if (!viewport) return

    // Save current scroll position BEFORE loading
    const previousScrollHeight = viewport.scrollHeight
    const previousScrollTop = viewport.scrollTop

    try {
      // Load old messages
      await loadMessages(convId, nextPage, true)
      setCurrentPage(nextPage)

      // Restore scroll position after DOM update
      // Use double RAF to ensure DOM is fully updated
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const currentViewport = messagesViewportRef.current || viewport
          if (currentViewport) {
            const newScrollHeight = currentViewport.scrollHeight
            const scrollDifference = newScrollHeight - previousScrollHeight
            // Maintain the same visual position - adjust scroll to keep user at same position
            currentViewport.scrollTop = previousScrollTop + scrollDifference
          }
        })
      })
    } catch (error: any) {
      showError('Lỗi', error.message || 'Không thể tải tin nhắn cũ')
    }
  }, [loadingOldMessages, hasMoreMessages, currentPage, loadMessages, showError])

  const handleSelectConversation = (conv: Conversation) => {
    // Only load messages if switching to a different conversation
    if (selectedConversation?._id !== conv._id) {
      setSelectedConversation(conv)
      loadMessages(conv._id, 1, false)
      // Reset load more button state
      setShowLoadMoreButton(false)
      // Mark as read when selecting conversation
      if (isConnected) {
        markAsRead(conv._id)
      }
      // Clear unread count when selecting conversation
      setUnreadCounts((prev) => ({
        ...prev,
        [conv._id]: 0,
      }))
      // Update conversation list to mark lastMessage as read
      setConversations((prev) => {
        return prev.map((c) => {
          if (c._id === conv._id && c.lastMessage && c.lastMessage.sender._id !== user?.id) {
            return {
              ...c,
              lastMessage: {
                ...c.lastMessage,
                isRead: true,
              },
            }
          }
          return c
        })
      })
      // Update URL
      const params = new URLSearchParams()
      params.set('conversationId', conv._id)
      router.replace(`/chat?${params.toString()}`, { scroll: false })
    }
  }

  // Setup scroll to bottom function
  useEffect(() => {
    scrollToBottomRef.current = () => {
      const messagesScrollArea = document.querySelector('[data-chat-messages="true"]')
      const viewport = messagesScrollArea?.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight
        isUserAtBottomRef.current = true
      }
    }
  }, [])

  // Track scroll position and handle loading old messages
  useEffect(() => {
    if (!selectedConversation) return
    selectedConversationIdRef.current = selectedConversation._id

    const messagesScrollArea = document.querySelector('[data-chat-messages="true"]')
    const viewport = messagesScrollArea?.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement

    if (!viewport) return

    const handleScroll = () => {
      const scrollHeight = viewport.scrollHeight
      const scrollTop = viewport.scrollTop
      const clientHeight = viewport.clientHeight
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight
      
      // Track if user is at bottom (within 50px)
      isUserAtBottomRef.current = distanceFromBottom < 50
      scrollPositionRef.current = scrollTop
      
      // Show load more button when scrolled near top (within 300px) and has more messages
      if (scrollTop < 300 && hasMoreMessages && !loadingOldMessages) {
        setShowLoadMoreButton(true)
      } else {
        setShowLoadMoreButton(false)
      }
    }

    viewport.addEventListener('scroll', handleScroll, { passive: true })
    
    // Prevent scroll from propagating to parent when at top or bottom
    const handleWheel = (e: WheelEvent) => {
      const scrollHeight = viewport.scrollHeight
      const scrollTop = viewport.scrollTop
      const clientHeight = viewport.clientHeight
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight
      const isAtTop = scrollTop <= 0
      const isAtBottom = distanceFromBottom <= 1
      
      // If scrolling down at bottom or scrolling up at top, prevent propagation
      if ((e.deltaY > 0 && isAtBottom) || (e.deltaY < 0 && isAtTop)) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
    }
    
    viewport.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      viewport.removeEventListener('scroll', handleScroll)
      viewport.removeEventListener('wheel', handleWheel)
    }
  }, [selectedConversation?._id])

  // Validation functions
  const containsLink = (text: string): boolean => {
    const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+|[^\s]+\.[a-z]{2,})/gi
    return urlPattern.test(text)
  }

  const containsPhoneNumber = (text: string): boolean => {
    // Match Vietnamese phone numbers and international formats
    const phonePattern = /(\+84|0)[0-9]{9,10}|[0-9]{3,4}[-\s]?[0-9]{3,4}[-\s]?[0-9]{3,4}/g
    return phonePattern.test(text)
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending || !isConnected || !selectedConversation) return

    const messageContent = newMessage.trim()

    // Validate: Check for links
    if (containsLink(messageContent)) {
      showError('Lỗi', 'Không được phép gửi link trong tin nhắn')
      return
    }

    // Validate: Check for phone numbers
    if (containsPhoneNumber(messageContent)) {
      showError('Lỗi', 'Không được phép gửi số điện thoại trong tin nhắn')
      return
    }

    // Stop typing indicator when sending message
    sendTyping(selectedConversation._id, false)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    const tempMessageId = `temp-${Date.now()}`
    
    // Optimistic update: show message immediately
    const optimisticMessage: Message = {
      _id: tempMessageId,
      conversation: selectedConversation._id,
      sender: {
        _id: user!.id,
        fullName: user!.fullName,
        email: user!.email,
        avatar: user!.avatar,
      },
      content: messageContent,
      isRead: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Add optimistic message immediately - only append, no re-render of existing
    setMessages((prev) => {
      const newMessages = [...prev, optimisticMessage]
      previousMessagesLengthRef.current = newMessages.length
      
      // Scroll to bottom immediately - use ref function
      setTimeout(() => {
        scrollToBottomRef.current()
      }, 0)
      
      return newMessages
    })
    
    setNewMessage('')

    try {
      setSending(true)
      sendMessage(selectedConversation._id, messageContent)
      // Note: When real message arrives via socket, it will replace the optimistic one
    } catch (error: any) {
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((msg) => msg._id !== tempMessageId))
      showError('Lỗi', error.message || 'Không thể gửi tin nhắn')
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }


  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true
    const otherUser = conv.otherUser || conv.users.find((u) => u._id !== user?.id)
    const searchLower = searchQuery.toLowerCase()
    return (
      otherUser?.fullName.toLowerCase().includes(searchLower) ||
      otherUser?.email.toLowerCase().includes(searchLower) ||
      conv.job?.title.toLowerCase().includes(searchLower)
    )
  })

  const getOtherUser = (conv: Conversation) => {
    return conv.otherUser || conv.users.find((u) => u._id !== user?.id)
  }

  // Format time: "vừa xong" if < 1 minute, otherwise use formatDistanceToNow
  const formatMessageTime = (date: Date | string) => {
    const messageDate = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - messageDate.getTime()) / 1000)
    
    if (diffInSeconds < 60) {
      return 'vừa xong'
    }
    
    return formatDistanceToNow(messageDate, {
      addSuffix: true,
      locale: vi,
    })
  }

  // Format full date and time for tooltip
  const formatFullDateTime = (date: Date | string) => {
    const messageDate = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const daysDiff = differenceInDays(now, messageDate)
    
    // If within 1 week (7 days), show day of week + time
    if (daysDiff < 7) {
      const dayOfWeekNum = messageDate.getDay() // 0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7
      const dayOfWeekNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
      const dayOfWeek = dayOfWeekNames[dayOfWeekNum]
      const time = format(messageDate, "HH:mm", { locale: vi })
      return `${dayOfWeek}, ${time}`
    }
    
    // If more than 1 week, show date + time
    return format(messageDate, "HH:mm, dd/MM/yyyy", { locale: vi })
  }


  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-7xl h-[calc(100vh-8rem)] flex overflow-hidden rounded-lg shadow-lg border border-gray-200 bg-white">
        {/* Sidebar - Conversations List */}
        <div className="w-80 border-r bg-white flex flex-col h-full rounded-l-lg">
        {/* Header */}
        <div className="p-4 border-b flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Tin nhắn
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm cuộc trò chuyện..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1 min-h-0">
          {loading ? (
            <div className="p-4 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Chưa có cuộc trò chuyện nào</p>
            </div>
          ) : (
            <div className="p-2">
              {filteredConversations.map((conv) => {
                const otherUser = getOtherUser(conv)
                const isSelected = selectedConversation?._id === conv._id
                const unreadCount = unreadCounts[conv._id] || 0
                const hasUnread = unreadCount > 0 || (conv.lastMessage && conv.lastMessage.sender._id !== user?.id && !conv.lastMessage.isRead)
                const isLastMessageFromOther = conv.lastMessage && conv.lastMessage.sender._id !== user?.id

                return (
                  <div
                    key={conv._id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors mb-1 overflow-hidden ${
                      isSelected
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 w-full min-w-0">
                      {otherUser?._id ? (
                        <Link href={`/users/${otherUser._id}`}>
                          <Avatar className="flex-shrink-0 hover:ring-2 hover:ring-primary transition-all cursor-pointer">
                            <AvatarImage src={otherUser?.avatar} alt={otherUser?.fullName} />
                            <AvatarFallback>{otherUser?.fullName?.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        </Link>
                      ) : (
                        <Avatar className="flex-shrink-0">
                          <AvatarImage src={otherUser?.avatar} alt={otherUser?.fullName} />
                          <AvatarFallback>{otherUser?.fullName?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex items-center justify-between mb-1 gap-2 min-w-0">
                          {otherUser?._id ? (
                            <Link 
                              href={`/users/${otherUser._id}`}
                              className={`text-sm truncate flex-1 min-w-0 hover:text-primary transition-colors ${
                                hasUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-900'
                              }`}
                            >
                              {otherUser?.fullName || 'Unknown'}
                            </Link>
                          ) : (
                            <p className={`text-sm truncate flex-1 min-w-0 ${
                              hasUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-900'
                            }`}>
                              {otherUser?.fullName || 'Unknown'}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {conv.lastMessageAt && (
                              <span className="text-xs text-gray-500 whitespace-nowrap">
                                {formatMessageTime(conv.lastMessageAt)}
                              </span>
                            )}
                            {hasUnread && (
                              <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                        <div className="min-w-0 overflow-hidden">
                          <p className={`text-xs truncate overflow-ellipsis whitespace-nowrap ${
                            hasUnread ? 'font-semibold text-gray-900' : 'text-gray-600'
                          }`}>
                            {(() => {
                              const content = conv.lastMessage?.content || 'Chưa có tin nhắn'
                              if (content === 'Chưa có tin nhắn') return content
                              const words = content.split(' ')
                              if (words.length <= 8) return content
                              return words.slice(0, 8).join(' ') + '...'
                            })()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col bg-gray-50 h-full overflow-hidden rounded-r-lg">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b p-4 flex-shrink-0">
              {(() => {
                const otherUser = getOtherUser(selectedConversation)
                const isUserOnline = userOnlineStatus?.isOnline || false
                const lastSeen = userOnlineStatus?.lastSeen
                
                return (
                  <div className="relative flex items-center w-full">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={otherUser?.avatar} alt={otherUser?.fullName} />
                          <AvatarFallback>{otherUser?.fullName?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {/* Online/Offline Status Indicator */}
                        <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
                          isUserOnline ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900">{otherUser?.fullName}</h3>
                        <div className="flex items-center gap-2">
                          {isUserOnline ? (
                            <p className="text-sm text-green-600">Đang hoạt động</p>
                          ) : lastSeen ? (
                            <p className="text-sm text-gray-500">
                              Hoạt động {formatDistanceToNow(new Date(lastSeen), { addSuffix: true, locale: vi })}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-500">Offline</p>
                          )}
                        </div>
                      </div>
                    </div>
                    {selectedConversation.job && (
                      <div className="absolute left-1/2 transform -translate-x-1/2">
                        <Link 
                          href={`/jobs?job_selected=${selectedConversation.job._id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-50 hover:bg-blue-100 border border-blue-200 text-xs font-medium text-blue-700 transition-colors"
                        >
                          <Briefcase className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[200px]">{selectedConversation.job.title}</span>
                        </Link>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>

            {/* Messages Area */}
            <ScrollArea 
              className="flex-1 min-h-0 p-4" 
              data-chat-messages="true"
              style={{ overscrollBehavior: 'contain' }}
            >
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Load more messages button - shown when scrolling near top */}
                  {showLoadMoreButton && hasMoreMessages && !loadingOldMessages && (
                    <div className="flex items-center justify-center py-2 sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={loadOldMessages}
                        className="text-xs shadow-sm"
                      >
                        <Loader2 className="h-3 w-3 mr-2" />
                        Tải thêm tin nhắn cũ
                      </Button>
                    </div>
                  )}
                  
                  {/* Loading old messages indicator */}
                  {loadingOldMessages && (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                      <span className="ml-2 text-sm text-gray-500">Đang tải tin nhắn cũ...</span>
                    </div>
                  )}
                  
                  {messages.map((message) => {
                    const isOwn = message.sender._id === user?.id
                    return (
                      <div
                        key={message._id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                          {!isOwn && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={message.sender.avatar} alt={message.sender.fullName} />
                              <AvatarFallback>{message.sender.fullName.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                          )}
                          <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={`rounded-2xl px-4 py-2 cursor-default ${
                                    isOwn
                                      ? 'bg-blue-600 text-white rounded-br-sm'
                                      : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
                                  }`}
                                >
                                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{formatFullDateTime(message.createdAt)}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {/* Typing Indicator */}
                  {isOtherUserTyping && selectedConversation && (() => {
                    const otherUser = getOtherUser(selectedConversation)
                    return (
                      <div className="flex justify-start">
                        <div className="flex gap-2 max-w-[70%]">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={otherUser?.avatar} alt={otherUser?.fullName} />
                            <AvatarFallback>{otherUser?.fullName?.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col items-start">
                            <div className="rounded-2xl rounded-bl-sm px-4 py-2 bg-white text-gray-900 border border-gray-200">
                              <div className="flex gap-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="bg-white border-t p-4 flex-shrink-0">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value)
                    // Send typing indicator when user types
                    if (selectedConversation && isConnected) {
                      const now = Date.now()
                      // Throttle typing events to max once per second
                      if (now - lastTypingSentRef.current > 1000) {
                        sendTyping(selectedConversation._id, true)
                        lastTypingSentRef.current = now
                        
                        // Stop typing indicator after 2 seconds of no typing
                        if (typingTimeoutRef.current) {
                          clearTimeout(typingTimeoutRef.current)
                        }
                        typingTimeoutRef.current = setTimeout(() => {
                          if (selectedConversation) {
                            sendTyping(selectedConversation._id, false)
                          }
                        }, 2000)
                      }
                    }
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="Nhập tin nhắn..."
                  disabled={!isConnected || sending}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending || !isConnected}
                  size="icon"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Chọn một cuộc trò chuyện để bắt đầu</p>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}

