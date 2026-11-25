import type { AuthResponse, LoginRequest, RegisterRequest, SessionResponse } from '@/contracts/auth'
import { apiClient } from '@/lib/api-client'

export async function login(body: LoginRequest) {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', body)
  return data
}

export async function register(body: RegisterRequest) {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', body)
  return data
}

export async function getSession(signal?: AbortSignal) {
  const { data } = await apiClient.get<SessionResponse>('/auth/session', { signal })
  return data
}

export async function logout() {
  await apiClient.post('/auth/logout')
}
