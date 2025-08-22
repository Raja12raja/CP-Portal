const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

// Prepare the Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Initialize Socket.IO server
  const io = new Server(server, {
    path: '/api/socketio',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  })

  // Socket.IO event handlers
  io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id)

    // Join contest room
    socket.on('join-contest', (contestId) => {
      socket.join(contestId)
      console.log(`👥 User ${socket.id} joined contest: ${contestId}`)
      
      // Get room info
      const room = io.sockets.adapter.rooms.get(contestId)
      console.log(`📊 Room ${contestId} now has ${room?.size || 0} users`)
    })

    // Leave contest room
    socket.on('leave-contest', (contestId) => {
      socket.leave(contestId)
      console.log(`👋 User ${socket.id} left contest: ${contestId}`)
    })

    // Handle new message
    socket.on('send-message', (data) => {
      console.log('📤 Message received from socket:', data)
      console.log(`📡 Broadcasting message to contest room: ${data.contestId}`)
      
      // Broadcast message to all users in the contest room (EXCEPT sender)
      socket.to(data.contestId).emit('new-message', {
        _id: Date.now().toString(), // Generate temporary ID
        contestId: data.contestId,
        userId: data.userId,
        username: data.username,
        userImage: data.userImage,
        message: data.message,
        timestamp: data.timestamp || new Date().toISOString(),
      })
      
      console.log(`✅ Message broadcasted to room ${data.contestId}`)
    })

    // Handle typing indicator
    socket.on('typing', (data) => {
      console.log(`⌨️ User ${data.username} typing in contest ${data.contestId}`)
      socket.to(data.contestId).emit('user-typing', {
        userId: data.userId,
        username: data.username,
        contestId: data.contestId,
      })
    })

    // Handle stop typing
    socket.on('stop-typing', (data) => {
      console.log(`⏹️ User ${data.username} stopped typing in contest ${data.contestId}`)
      socket.to(data.contestId).emit('user-stop-typing', {
        userId: data.userId,
        contestId: data.contestId,
      })
    })

    // Debug events
    socket.on('ping', (data) => {
      console.log('🏓 Ping received from:', socket.id, data)
      socket.emit('pong', { timestamp: Date.now(), original: data })
    })

    socket.on('disconnect', (reason) => {
      console.log(`❌ Client disconnected: ${socket.id}, reason: ${reason}`)
    })

    // Emit connection success
    socket.emit('connection-success', { 
      socketId: socket.id, 
      message: 'Successfully connected to chat server' 
    })
  })

  server.listen(port, (err) => {
    if (err) throw err
    console.log(`🚀 Ready on http://${hostname}:${port}`)
    console.log('🔌 Socket.IO server is running')
  })
})
