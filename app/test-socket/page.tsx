'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

export default function TestSocket() {
  const { user } = useUser()
  const [isClient, setIsClient] = useState(false)
  const [socket, setSocket] = useState<any>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<string[]>([])
  const [testMessage, setTestMessage] = useState('')
  const [connectionLogs, setConnectionLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setConnectionLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!user || !isClient) return

    addLog('Initializing Socket.IO connection...')

    const newSocket = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
      path: '/api/socketio',
      transports: ['websocket', 'polling'],
      timeout: 20000,
    })

    newSocket.on('connect', () => {
      addLog(`✅ Connected to Socket.IO server with ID: ${newSocket.id}`)
      setIsConnected(true)
      
      // Test joining a contest room
      newSocket.emit('join-contest', 'test-contest-123')
      addLog('📤 Emitted: join-contest event')
    })

    newSocket.on('connect_error', (error) => {
      addLog(`❌ Connection error: ${error.message}`)
      console.error('Socket.IO connection error:', error)
    })

    newSocket.on('disconnect', (reason) => {
      addLog(`❌ Disconnected: ${reason}`)
      setIsConnected(false)
    })

    newSocket.on('connection-success', (data) => {
      addLog(`🎉 Server confirmed connection: ${JSON.stringify(data)}`)
    })

    newSocket.on('new-message', (message) => {
      addLog(`📥 Received new message: ${JSON.stringify(message)}`)
      setMessages(prev => [...prev, `Received: ${message.message}`])
    })

    setSocket(newSocket)

    return () => {
      addLog('Cleaning up Socket.IO connection...')
      newSocket.disconnect()
    }
  }, [user, isClient])

  const sendTestMessage = () => {
    if (!socket || !isConnected || !testMessage.trim()) return

    const messageData = {
      message: testMessage,
      contestId: 'test-contest-123',
      userId: user?.id,
      username: user?.fullName || 'Test User',
      timestamp: new Date().toISOString(),
    }

    addLog(`📤 Sending test message: ${testMessage}`)
    
    socket.emit('send-message', messageData)
    setTestMessage('')
  }

  const testConnection = () => {
    if (!socket) {
      addLog('❌ No socket available')
      return
    }

    addLog('🧪 Testing Socket.IO connection...')
    
    // Test basic emit
    socket.emit('ping', { timestamp: Date.now() })
    addLog('📤 Emitted: ping event')
    
    // Test room join
    socket.emit('join-contest', 'test-room')
    addLog('📤 Emitted: join-contest event')
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600">Please sign in to test Socket.IO functionality.</p>
        </div>
      </div>
    )
  }

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Socket.IO Test & Debug Page</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Connection Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                  {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
                </span>
              </div>
              
              <div className="space-y-1 text-sm">
                <p><strong>User ID:</strong> {user?.id}</p>
                <p><strong>Username:</strong> {user?.fullName || user?.username || 'Anonymous'}</p>
                <p><strong>Socket ID:</strong> {socket?.id || 'No socket'}</p>
                <p><strong>Connection State:</strong> {socket?.connected ? 'Connected' : 'Not Connected'}</p>
              </div>

              <button
                onClick={testConnection}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                🧪 Test Connection
              </button>
            </div>
          </div>

          {/* Test Message */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Test Message</h2>
            <div className="space-y-3">
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Enter test message..."
                className="w-full border border-gray-300 rounded px-3 py-2"
                onKeyPress={(e) => e.key === 'Enter' && sendTestMessage()}
              />
              <button
                onClick={sendTestMessage}
                disabled={!isConnected || !testMessage.trim()}
                className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                📤 Send Test Message
              </button>
            </div>
          </div>
        </div>

        {/* Connection Logs */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Connection Logs</h2>
          <div className="bg-gray-100 rounded p-4 h-64 overflow-y-auto">
            {connectionLogs.length === 0 ? (
              <p className="text-gray-500">No logs yet...</p>
            ) : (
              connectionLogs.map((log, index) => (
                <div key={index} className="text-sm text-gray-700 mb-1 font-mono">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Received Messages */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Received Messages</h2>
          <div className="bg-gray-100 rounded p-4 h-32 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-gray-500">No messages received yet...</p>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className="text-sm text-gray-700 mb-1">
                  {msg}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
