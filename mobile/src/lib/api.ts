import Constants from 'expo-constants'

type Role = 'admin' | 'user'

let currentRole: Role = 'user'
let useSandbox = false

export function setApiRole(role: Role) {
  currentRole = role
}

export function setApiSandbox(sandbox: boolean) {
  useSandbox = sandbox
}

function getBaseUrl(): string {
  const extra = Constants.expoConfig?.extra as Record<string, string> | undefined
  if (useSandbox) {
    return extra?.sandboxApiUrl ?? 'http://localhost:3000'
  }
  return extra?.apiUrl ?? 'http://localhost:3000'
}

function getToken(): string {
  const extra = Constants.expoConfig?.extra as Record<string, string> | undefined
  if (currentRole === 'admin') {
    return extra?.adminSecret ?? ''
  }
  return extra?.userSecret ?? ''
}

async function request<T>(
  method: string,
  path: string,
  body?: object
): Promise<T> {
  const url = `${getBaseUrl()}${path}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  }
  if (useSandbox) {
    headers['x-sandbox'] = 'true'
  }
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${method} ${path} → ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

export const sendNudge = () => request<{ ok: boolean }>('POST', '/api/nudge')

export const sendMessage = (content: string, message_type = 'text') =>
  request<{ ok: boolean; id: string }>('POST', '/api/message', {
    content,
    message_type,
  })

export const triggerEvent = (
  event_type: string,
  payload: object = {},
  scheduled_at?: string
) =>
  request<{ ok: boolean; id: string; scheduled: boolean }>('POST', '/api/event', {
    event_type,
    payload,
    scheduled_at,
  })

export const getMessages = () =>
  request<
    Array<{
      id: string
      content: string
      message_type: string
      read: boolean
      created_at: string
    }>
  >('GET', '/api/messages')

export const getGameState = () =>
  request<{ state: object; updated_at: string | null }>('GET', '/api/game')

export const updateGameState = (state: object) =>
  request<{ ok: boolean }>('POST', '/api/game', { state })

export const registerPushToken = (userId: string, token: string) =>
  request<{ ok: boolean }>('POST', `/api/users/${userId}/push-token`, { token })
