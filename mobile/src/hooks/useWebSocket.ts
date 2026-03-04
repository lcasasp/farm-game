import { useEffect, useRef, useCallback } from 'react'
import Constants from 'expo-constants'
import { useRole } from '../context/RoleContext'

export type WsMessage = {
  type: 'message' | 'nudge' | 'event' | 'auth_ok'
  [key: string]: unknown
}

type Handler = (msg: WsMessage) => void

let globalHandlers: Handler[] = []
let socket: WebSocket | null = null
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
let currentToken = ''

function getWsUrl(apiUrl: string): string {
  return apiUrl.replace(/^http/, 'ws') + '/ws'
}

function connect(token: string) {
  const extra = Constants.expoConfig?.extra as Record<string, string> | undefined
  const apiUrl = extra?.apiUrl ?? 'http://localhost:3000'
  const url = getWsUrl(apiUrl)

  if (socket) {
    socket.onclose = null
    socket.close()
  }

  socket = new WebSocket(url)

  socket.onopen = () => {
    socket?.send(JSON.stringify({ type: 'auth', token }))
  }

  socket.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data as string) as WsMessage
      globalHandlers.forEach((h) => h(msg))
    } catch {
      // ignore
    }
  }

  socket.onclose = () => {
    scheduleReconnect(token)
  }

  socket.onerror = () => {
    socket?.close()
  }
}

let backoffMs = 1000

function scheduleReconnect(token: string) {
  if (reconnectTimeout) clearTimeout(reconnectTimeout)
  reconnectTimeout = setTimeout(() => {
    backoffMs = Math.min(backoffMs * 2, 30000)
    connect(token)
  }, backoffMs)
}

export function useWebSocket(onMessage: Handler) {
  const { role } = useRole()
  const handlerRef = useRef<Handler>(onMessage)
  handlerRef.current = onMessage

  const stableHandler = useCallback((msg: WsMessage) => {
    handlerRef.current(msg)
  }, [])

  useEffect(() => {
    globalHandlers.push(stableHandler)
    return () => {
      globalHandlers = globalHandlers.filter((h) => h !== stableHandler)
    }
  }, [stableHandler])

  useEffect(() => {
    const extra = Constants.expoConfig?.extra as Record<string, string> | undefined
    const token =
      role === 'admin' ? (extra?.adminSecret ?? '') : (extra?.userSecret ?? '')

    if (token !== currentToken) {
      currentToken = token
      backoffMs = 1000
      connect(token)
    }
  }, [role])
}
