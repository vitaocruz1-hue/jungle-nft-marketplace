import type { User } from '@/contracts/auth'

import { db, type SessionRecord } from '../db'
import type { UserRecord } from '../db/fixtures/users'
import { errorResponse } from './http'

/** Duração da sessão simulada. */
export const SESSION_TTL_MS = 30 * 60 * 1000

/** SHA-256 de "sal:senha" em hexadecimal (WebCrypto do navegador). */
export async function hashPassword(salt: string, password: string) {
  const bytes = new TextEncoder().encode(`${salt}:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

export function randomToken() {
  return crypto.randomUUID()
}

export function toUser(record: UserRecord): User {
  return {
    id: record.id,
    username: record.username,
    email: record.email,
    displayName: record.displayName,
    bio: record.bio,
    avatarUrl: record.avatarUrl,
    ensName: record.ensName,
    walletNickname: record.walletNickname,
  }
}

export function createSession(userId: string): SessionRecord {
  const session: SessionRecord = {
    token: randomToken(),
    userId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  }
  db.state.sessions.push(session)
  db.persist()
  return session
}

function bearerToken(request: Request) {
  const header = request.headers.get('Authorization') ?? ''
  return header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null
}

type AuthResult =
  | { ok: true; user: UserRecord; session: SessionRecord }
  | { ok: false; response: ReturnType<typeof errorResponse> }

/** Valida o token do cabeçalho Authorization. */
export function authenticate(request: Request): AuthResult | null {
  const token = bearerToken(request)
  if (!token) return null
  const session = db.state.sessions.find((s) => s.token === token)
  if (!session) {
    return {
      ok: false,
      response: errorResponse(401, 'UNAUTHENTICATED', 'Sessão inválida. Entre novamente.'),
    }
  }
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    return {
      ok: false,
      response: errorResponse(401, 'SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente.'),
    }
  }
  const user = db.state.users.find((u) => u.id === session.userId)
  if (!user) {
    return { ok: false, response: errorResponse(401, 'UNAUTHENTICATED', 'Usuário não encontrado.') }
  }
  return { ok: true, user, session }
}

/** Para rotas privadas: sem token válido → 401. */
export function requireAuth(request: Request): AuthResult {
  return (
    authenticate(request) ?? {
      ok: false,
      response: errorResponse(401, 'UNAUTHENTICATED', 'Entre na sua conta para continuar.'),
    }
  )
}

/** Expira a sessão atual (usado pelo painel de cenários e pelos testes). */
export function expireAllSessions() {
  for (const session of db.state.sessions) session.expiresAt = new Date(0).toISOString()
  db.persist()
}
