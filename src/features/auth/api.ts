import type { AuthResponse, LoginRequest, RegisterRequest, SessionResponse } from '@/contracts/auth'
import { authResponseSchema, sessionResponseSchema } from '@/contracts/schemas'
import { apiClient } from '@/lib/api-client'
import { parseResponse } from '@/lib/parse-response'

export async function login(body: LoginRequest) {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', body)
  return parseResponse(authResponseSchema, data, 'POST /auth/login')
}

export async function register(body: RegisterRequest) {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', body)
  return parseResponse(authResponseSchema, data, 'POST /auth/register')
}

export async function getSession(signal?: AbortSignal) {
  const { data } = await apiClient.get<SessionResponse>('/auth/session', { signal })
  return parseResponse(sessionResponseSchema, data, 'GET /auth/session')
}

export async function logout() {
  await apiClient.post('/auth/logout')
}
