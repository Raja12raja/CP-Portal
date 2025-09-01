'use client'

import { useState, useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Send, ArrowLeft, MessageCircle, Users, Clock } from 'lucide-react'
import { useSocket } from '../../../../lib/useSocket'

interface Contest {
  _id: string
  name: string
  platform: string
  startTime: string
  endTime: string
  duration: number
  url: string
  description?: string
}

interface ChatMessage {
  _id: string
  contestId: string
  userId: string
  username: string
  userImage?: string
  message: string
  timestamp: string
}

interface TypingUser {
  userId: string
  username: string
}

export default function ContestDiscussion() {
  const { user } = useUser()
  const params = useParams()
  const router = useRouter()
  const contestId = params.contestId as string

  const [contest, setContest] = useState<Contest | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { socket, isConnected, typingUsers, onlineUsers, sendMessage, startTyping, stopTyping, onNewMessage } = useSocket({
    contestId,
    userId: user?.id,
    username: user?.fullName || user?.username || 'Anonymous'
  })

  // Fetch contest details
  useEffect(() => {
    const fetchContest = async () => {
      try {
        const response = await fetch(`/api/contests`)
        const data = await response.json()
        if (data.success) {
          const foundContest = data.data.find((c: Contest) => c._id === contestId)
          if (foundContest) {
            setContest(foundContest)
          } else {
            setError('Contest not found')
          }
        }
      } catch (error) {
        setError('Failed to fetch contest details')
      }
    }

    if (contestId) {
      fetchContest()
    }
  }, [contestId])

  // Listen for new messages
  useEffect(() => {
    if (!onNewMessage) return

    const cleanup = onNewMessage((message: ChatMessage) => {
      console.log('📥 Received new message via socket:', message)
      setMessages(prev => [...prev, message])
    })

    return cleanup
  }, [onNewMessage])

  // Fetch existing messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/contests/${contestId}/chat`)
        const data = await response.json()
        if (data.success) {
          setMessages(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error)
      } finally {
        setLoading(false)
      }
    }

    if (contestId) {
      fetchMessages()
    }
  }, [contestId])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle typing indicator
  const handleTyping = () => {
    if (!user) return

    if (!isTyping) {
      setIsTyping(true)
      startTyping()
    }

    // Clear existing timeout
    const timeoutId = setTimeout(() => {
      setIsTyping(false)
      stopTyping()
    }, 1000)

    return () => clearTimeout(timeoutId)
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return

    const messageData = {
      message: newMessage.trim(),
      username: user.fullName || user.username || 'Anonymous',
      userImage: user.imageUrl,
    }

    try {
      // Send message to server
      const response = await fetch(`/api/contests/${contestId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData),
      })

      if (response.ok) {
        // Get the response data to get the message ID and timestamp
        const responseData = await response.json()

        if (responseData.success) {
          // Create a new message object with the response data
          const newMessageObj: ChatMessage = {
            _id: responseData.data._id,
            contestId: contestId,
            userId: user.id,
            username: messageData.username,
            userImage: messageData.userImage,
            message: messageData.message,
            timestamp: responseData.data.timestamp || new Date().toISOString(),
          }

          // Add the message to local state immediately for instant display
          setMessages(prev => [...prev, newMessageObj])

          // Emit message through socket for other users (this ensures real-time updates)
          if (socket && isConnected) {
            console.log('📤 Emitting message through socket:', {
              message: messageData.message,
              contestId: contestId,
              userId: user.id,
              username: messageData.username,
            })

            sendMessage(messageData.message);
          } else {
            console.warn('⚠️ Socket not connected, message only saved to database')
          }
        }

        setNewMessage('')

        // Stop typing indicator
        if (isTyping) {
          setIsTyping(false)
          stopTyping()
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);
    const diffInSeconds = (now.getTime() - date.getTime()) / 1000;
    if (diffInSeconds < 1) {
      return 'Just now'
    } else if (diffInMinutes < 1) {
      return `${Math.floor(diffInSeconds)}s ago`
    } else if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)}m ago`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading discussion...</p>
        </div>
      </div>
    )
  }

  if (error || !contest) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error || 'Contest not found'}</p>
          <Link
            href="/contests"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Contests
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/contests"
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {contest.name}
                </h1>
                <p className="text-sm text-gray-500">
                  {contest.platform} • Discussion
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>{onlineUsers} online</span>
              </div>
              <Link
                href={contest.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                View Contest
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Contest Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Start:</span>
              <span className="font-medium text-black">{new Date(contest.startTime).toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600 ">Duration:</span>
              <span className="font-medium text-black">{Math.floor(contest.duration / 60)}h {contest.duration % 60}m</span>
            </div>
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Messages:</span>
              <span className="font-medium text-black">{messages.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 text-black" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => {
                const isOwnMessage = message.userId === user?.id;
                return (
                  <div key={message._id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : 'space-x-3'} max-w-xs lg:max-w-md`}>
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <img
                          src={message.userImage || '/default-avatar.svg'}
                          alt={message.username}
                          className="h-8 w-8 rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/default-avatar.svg'
                          }}
                        />
                      </div>

                      {/* Message Content */}
                      <div className={`${isOwnMessage ? 'text-right' : 'text-left'}`}>
                        {/* Username and timestamp */}
                        <div className={`flex items-center space-x-2 mb-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                          <span className={`font-medium text-sm text-black${isOwnMessage ? 'text-blue-600' : 'text-gray-900'}`}>
                            {isOwnMessage ? 'You' : message.username}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTime(message.timestamp)}
                          </span>
                        </div>

                        {/* Message bubble */}
                        <div className={`inline-block px-4 py-2 rounded-lg ${isOwnMessage
                          ? 'bg-blue-600 text-black rounded-br-none'
                          : 'bg-gray-100 text-gray-800 rounded-bl-none'
                          }`}>
                          <p className="text-sm text-black">{message.message}</p>
                        </div>

                        {/* Date (smaller, below message) */}
                        <div className={`mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                          <span className="text-xs text-gray-400">
                            {formatDate(message.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Typing indicators */}
            {typingUsers.length > 0 && (
              typingUsers.map((typingUser) => {
                const isOwnTyping = typingUser.userId === user?.id;
                return (
                  <div key={typingUser.userId} className={`flex ${isOwnTyping ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex ${isOwnTyping ? 'flex-row-reverse space-x-reverse' : 'space-x-3'} max-w-xs lg:max-w-md`}>
                      {/* Avatar placeholder */}
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-xs text-gray-500">...</span>
                        </div>
                      </div>

                      {/* Typing indicator */}
                      <div className={`${isOwnTyping ? 'text-right' : 'text-left'}`}>
                        <div className={`inline-block px-4 py-2 rounded-lg ${isOwnTyping
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-gray-100 text-gray-800 rounded-bl-none'
                          }`}>
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex space-x-3">
              <div className="flex-1">
                <textarea
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value)
                    handleTyping()
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black resize-none"
                  rows={2}
                  maxLength={1000}
                />
                <div className="text-xs text-gray-500 text-right mt-1">
                  {newMessage.length}/1000
                </div>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>Send</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
