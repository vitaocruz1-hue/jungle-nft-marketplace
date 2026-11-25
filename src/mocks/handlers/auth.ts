import { http, HttpResponse, type DefaultBodyType, type PathParams } from 'msw'

import {
  EMAIL_PATTERN,
  USERNAME_PATTERN,
  validatePassword,
  type AuthResponse,
  type LoginRequest,
  type RegisterRequest,
  type SessionResponse,
} from '@/contracts/auth'
import type { ApiErrorBody } from '@/contracts/common'

import { db } from '../db'
import { simulateNetwork } from '../scenarios'
import {
  authenticate,
  createSession,
  hashPassword,
  randomToken,
  requireAuth,
  toUser,
} from '../utils/auth'
import { mergeGuestCart } from '../utils/cart'
import { apiUrl, errorResponse, readJson } from '../utils/http'

export const authHandlers = [
  http.post<PathParams, DefaultBodyType, AuthResponse | ApiErrorBody>(
    apiUrl('/auth/register'),
    async ({ request }) => {
      await simulateNetwork()
      const body = await readJson<RegisterRequest>(request)
      const username = String(body?.username ?? '')
        .trim()
        .toLowerCase()
      const email = String(body?.email ?? '')
        .trim()
        .toLowerCase()
      const password = String(body?.password ?? '')

      const fieldErrors: Record<string, string> = {}
      if (!USERNAME_PATTERN.test(username))
        fieldErrors.username = 'Use 3 a 30 caracteres: letras minúsculas, números, ponto ou _.'
      if (!EMAIL_PATTERN.test(email)) fieldErrors.email = 'Informe um e-mail válido.'
      const passwordError = validatePassword(password)
      if (passwordError) fieldErrors.password = passwordError
      if (Object.keys(fieldErrors).length > 0) {
        return errorResponse(422, 'VALIDATION_ERROR', 'Revise os campos destacados.', fieldErrors)
      }

      const conflicts: Record<string, string> = {}
      if (db.state.users.some((u) => u.email === email))
        conflicts.email = 'Este e-mail já está cadastrado.'
      if (db.state.users.some((u) => u.username === username))
        conflicts.username = 'Este nome de usuário já está em uso.'
      if (Object.keys(conflicts).length > 0) {
        return errorResponse(409, 'CONFLICT', 'Já existe uma conta com esses dados.', conflicts)
      }

      const salt = randomToken()
      const user = {
        id: db.nextId('user'),
        username,
        email,
        displayName: username,
        bio: '',
        avatarUrl: null,
        passwordSalt: salt,
        passwordHash: await hashPassword(salt, password),
        createdAt: new Date().toISOString(),
      }
      db.state.users.push(user)
      const session = createSession(user.id)
      mergeGuestCart(request, user.id)
      db.persist()
      return HttpResponse.json(
        { token: session.token, user: toUser(user), expiresAt: session.expiresAt },
        { status: 201 },
      )
    },
  ),

  http.post<PathParams, DefaultBodyType, AuthResponse | ApiErrorBody>(
    apiUrl('/auth/login'),
    async ({ request }) => {
      await simulateNetwork()
      const body = await readJson<LoginRequest>(request)
      const email = String(body?.email ?? '')
        .trim()
        .toLowerCase()
      const password = String(body?.password ?? '')
      if (!email || !password) {
        return errorResponse(422, 'VALIDATION_ERROR', 'Informe e-mail e senha.', {
          ...(email ? {} : { email: 'Informe seu e-mail.' }),
          ...(password ? {} : { password: 'Informe sua senha.' }),
        })
      }
      const user = db.state.users.find((u) => u.email === email)
      const valid = user && (await hashPassword(user.passwordSalt, password)) === user.passwordHash
      if (!user || !valid) {
        return errorResponse(401, 'UNAUTHENTICATED', 'E-mail ou senha incorretos.')
      }
      const session = createSession(user.id)
      mergeGuestCart(request, user.id)
      db.persist()
      return HttpResponse.json({
        token: session.token,
        user: toUser(user),
        expiresAt: session.expiresAt,
      })
    },
  ),

  http.get<PathParams, DefaultBodyType, SessionResponse | ApiErrorBody>(
    apiUrl('/auth/session'),
    async ({ request }) => {
      await simulateNetwork()
      const auth = requireAuth(request)
      if (!auth.ok) return auth.response
      return HttpResponse.json({ user: toUser(auth.user), expiresAt: auth.session.expiresAt })
    },
  ),

  http.post(apiUrl('/auth/logout'), async ({ request }) => {
    await simulateNetwork()
    const auth = authenticate(request)
    if (auth?.ok) {
      db.state.sessions = db.state.sessions.filter((s) => s.token !== auth.session.token)
      db.persist()
    }
    return new HttpResponse(null, { status: 204 })
  }),
]
