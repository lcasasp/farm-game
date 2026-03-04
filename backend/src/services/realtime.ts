import { WebSocketServer, WebSocket } from 'ws'
import { IncomingMessage } from 'http'
import { Server } from 'http'

const clients = new Map<string, WebSocket>()

export function initWebSocketServer(httpServer: Server) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' })

  wss.on('connection', (socket: WebSocket, _req: IncomingMessage) => {
    let userId: string | null = null

    const authTimeout = setTimeout(() => {
      if (!userId) {
        socket.close(4001, 'Auth timeout')
      }
    }, 5000)

    socket.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString())
        if (msg.type === 'auth' && typeof msg.token === 'string') {
          if (msg.token === process.env.ADMIN_SECRET) {
            userId = 'admin'
          } else if (msg.token === process.env.USER_SECRET) {
            userId = 'user'
          } else {
            socket.close(4001, 'Invalid token')
            return
          }
          clearTimeout(authTimeout)
          clients.set(userId, socket)
          socket.send(JSON.stringify({ type: 'auth_ok', userId }))
        }
      } catch {
        // ignore malformed messages
      }
    })

    socket.on('close', () => {
      if (userId && clients.get(userId) === socket) {
        clients.delete(userId)
      }
    })

    socket.on('error', (err) => {
      console.error('WebSocket error:', err)
    })
  })

  return wss
}

export function broadcast(userId: string, payload: object) {
  const socket = clients.get(userId)
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload))
  }
}
