import type { IsoDateTime } from './common'

export interface User {
  id: string
  username: string
  email: string
  /** Nome de exibição (perfil). */
  displayName: string
  bio: string
  avatarUrl: string | null
  /** Nome ENS sem ".eth". */
  ensName: string
  walletNickname: string
}

/** POST /api/auth/login */
export interface LoginRequest {
  email: string
  password: string
}

/** POST /api/auth/register */
export interface RegisterRequest {
  username: string
  email: string
  password: string
}

/** Resposta de login e cadastro. O token vai no cabeçalho Authorization: Bearer. */
export interface AuthResponse {
  token: string
  user: User
  expiresAt: IsoDateTime
}

/** GET /api/auth/session */
export interface SessionResponse {
  user: User
  expiresAt: IsoDateTime
}

/** Regras de validação compartilhadas entre formulário e API. */
export const USERNAME_PATTERN = /^[a-z0-9._]{3,30}$/
export const PASSWORD_MIN_LENGTH = 8

/** Senha: 8+ caracteres, com letra e número. Retorna a mensagem de erro ou null. */
export function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH)
    return `Use pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) return 'Use letras e números.'
  return null
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** PATCH /api/profile */
export interface UpdateProfileRequest {
  displayName: string
  username: string
  email: string
  ensName: string
  walletNickname: string
}

/** PUT /api/profile/avatar — imagem como data URL (até 1 MB). */
export interface UpdateAvatarRequest {
  dataUrl: string
}

export const AVATAR_MAX_BYTES = 1024 * 1024

/** POST /api/profile/password */
export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}
