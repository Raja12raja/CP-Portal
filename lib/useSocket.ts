import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface UseSocketOptions {
  contestId: string
  userId?: string
  username?: string
}

export function useSocket({ contestId, userId, username }: UseSocketOptions) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Array<{ userId: string; username: string }>>([])
  const [onlineUsers, setOnlineUsers] = useState(0)
  
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!userId || !username || !contestId) return

    console.log('Initializing Socket.IO connection...', { userId, username, contestId })

    const newSocket = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
      path: '/api/socketio',
      transports: ['websocket', 'polling'],
      timeout: 20000,
    })

    newSocket.on('connect', () => {
      console.log('✅ Connected to chat server with ID:', newSocket.id)
      setIsConnected(true)
      newSocket.emit('join-contest', contestId)
      console.log('Joined contest room:', contestId)
    })

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error)
    })

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from chat server:', reason)
      setIsConnected(false)
    })

    newSocket.on('user-typing', (typingUser: { userId: string; username: string }) => {
      setTypingUsers(prev => {
        const filtered = prev.filter(u => u.userId !== typingUser.userId)
        return [...filtered, typingUser]
      })
    })

    newSocket.on('user-stop-typing', (typingUser: { userId: string; username: string }) => {
      setTypingUsers(prev => prev.filter(u => u.userId !== typingUser.userId))
    })

    // Listen for new messages directly
    newSocket.on('new-message', (message: any) => {
      console.log('📥 useSocket: Received new message:', message)
    })

    // Listen for connection success
    newSocket.on('connection-success', (data: any) => {
      console.log('🎉 useSocket: Connection confirmed:', data)
    })

    setSocket(newSocket)

    return () => {
      newSocket.emit('leave-contest', contestId)
      newSocket.disconnect()
    }
  }, [contestId, userId, username])

  const sendMessage = (message: string) => {
    if (!socket || !isConnected) return false

    socket.emit('send-message', {
      message,
      contestId,
      userId,
      username,
    })
    return true
  }

  const startTyping = () => {
    if (!socket || !isConnected) return

    socket.emit('typing', {
      userId,
      username,
      contestId,
    })

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping()
    }, 1000)
  }

  const stopTyping = () => {
    if (!socket || !isConnected) return

    socket.emit('stop-typing', {
      userId,
      contestId,
    })
  }

  const onNewMessage = (callback: (message: any) => void) => {
    if (!socket) return

    // Remove any existing listeners first
    socket.off('new-message', callback)
    
    // Add the new listener
    socket.on('new-message', callback)

    return () => {
      socket.off('new-message', callback)
    }
  }
  

  return {
    socket,
    isConnected,
    typingUsers,
    onlineUsers,
    sendMessage,
    startTyping,
    stopTyping,
    onNewMessage,
  }
}
