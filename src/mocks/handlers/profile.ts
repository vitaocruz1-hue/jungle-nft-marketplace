import { http, HttpResponse, type DefaultBodyType, type PathParams } from 'msw'

import {
  AVATAR_MAX_BYTES,
  EMAIL_PATTERN,
  USERNAME_PATTERN,
  validatePassword,
  type ChangePasswordRequest,
  type UpdateAvatarRequest,
  type UpdateProfileRequest,
  type User,
} from '@/contracts/auth'
import type { ApiErrorBody } from '@/contracts/common'
import { ENS_NAME_PATTERN } from '@/contracts/wallets'

import { db } from '../db'
import { simulateNetwork } from '../scenarios'
import { hashPassword, randomToken, requireAuth, toUser } from '../utils/auth'
import { apiUrl, errorResponse, readJson } from '../utils/http'

export const profileHandlers = [
  http.get<PathParams, DefaultBodyType, User | ApiErrorBody>(
    apiUrl('/profile'),
    async ({ request }) => {
      await simulateNetwork()
      const auth = requireAuth(request)
      if (!auth.ok) return auth.response
      return HttpResponse.json(toUser(auth.user))
    },
  ),

  http.patch<PathParams, DefaultBodyType, User | ApiErrorBody>(
    apiUrl('/profile'),
    async ({ request }) => {
      await simulateNetwork()
      const auth = requireAuth(request)
      if (!auth.ok) return auth.response
      const body = (await readJson<UpdateProfileRequest>(request)) ?? {}
      const input = {
        displayName: String(body.displayName ?? '').trim(),
        username: String(body.username ?? '')
          .trim()
          .toLowerCase(),
        email: String(body.email ?? '')
          .trim()
          .toLowerCase(),
        ensName: String(body.ensName ?? '')
          .trim()
          .toLowerCase(),
        walletNickname: String(body.walletNickname ?? '').trim(),
      }
      const errors: Record<string, string> = {}
      if (!input.displayName) errors.displayName = 'Informe o nome de exibição.'
      if (!USERNAME_PATTERN.test(input.username))
        errors.username = 'Use 3 a 30 caracteres: letras minúsculas, números, ponto ou _.'
      if (!EMAIL_PATTERN.test(input.email)) errors.email = 'Informe um e-mail válido.'
      if (!ENS_NAME_PATTERN.test(input.ensName))
        errors.ensName = 'Use de 3 a 40 letras minúsculas, números ou hífen.'
      if (!input.walletNickname) errors.walletNickname = 'Informe o apelido da carteira.'
      if (Object.keys(errors).length > 0) {
        return errorResponse(422, 'VALIDATION_ERROR', 'Revise os campos destacados.', errors)
      }
      const others = db.state.users.filter((u) => u.id !== auth.user.id)
      const conflicts: Record<string, string> = {}
      if (others.some((u) => u.email === input.email))
        conflicts.email = 'Este e-mail já está em uso.'
      if (others.some((u) => u.username === input.username))
        conflicts.username = 'Este nome de usuário já está em uso.'
      if (Object.keys(conflicts).length > 0) {
        return errorResponse(409, 'CONFLICT', 'Dados já usados por outra conta.', conflicts)
      }
      Object.assign(auth.user, input)
      db.persist()
      return HttpResponse.json(toUser(auth.user))
    },
  ),

  http.put<PathParams, DefaultBodyType, User | ApiErrorBody>(
    apiUrl('/profile/avatar'),
    async ({ request }) => {
      await simulateNetwork()
      const auth = requireAuth(request)
      if (!auth.ok) return auth.response
      const body = await readJson<UpdateAvatarRequest>(request)
      const dataUrl = String(body?.dataUrl ?? '')
      if (!/^data:image\/(png|jpeg|webp|gif);base64,/.test(dataUrl)) {
        return errorResponse(422, 'VALIDATION_ERROR', 'Envie uma imagem PNG, JPG, WebP ou GIF.', {
          avatar: 'Formato de imagem não suportado.',
        })
      }
      // Tamanho aproximado do arquivo original (base64 ocupa ~4/3).
      const bytes = Math.ceil((dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75)
      if (bytes > AVATAR_MAX_BYTES) {
        return errorResponse(422, 'VALIDATION_ERROR', 'A imagem deve ter até 1 MB.', {
          avatar: 'A imagem deve ter até 1 MB.',
        })
      }
      auth.user.avatarUrl = dataUrl
      db.persist()
      return HttpResponse.json(toUser(auth.user))
    },
  ),

  http.delete<PathParams, DefaultBodyType, User | ApiErrorBody>(
    apiUrl('/profile/avatar'),
    async ({ request }) => {
      await simulateNetwork()
      const auth = requireAuth(request)
      if (!auth.ok) return auth.response
      auth.user.avatarUrl = null
      db.persist()
      return HttpResponse.json(toUser(auth.user))
    },
  ),

  http.post<PathParams, DefaultBodyType, null | ApiErrorBody>(
    apiUrl('/profile/password'),
    async ({ request }) => {
      await simulateNetwork()
      const auth = requireAuth(request)
      if (!auth.ok) return auth.response
      const body = await readJson<ChangePasswordRequest>(request)
      const current = String(body?.currentPassword ?? '')
      const next = String(body?.newPassword ?? '')
      if ((await hashPassword(auth.user.passwordSalt, current)) !== auth.user.passwordHash) {
        return errorResponse(422, 'VALIDATION_ERROR', 'Senha atual incorreta.', {
          currentPassword: 'Senha atual incorreta.',
        })
      }
      const error = validatePassword(next)
      if (error) {
        return errorResponse(422, 'VALIDATION_ERROR', error, { newPassword: error })
      }
      if (next === current) {
        return errorResponse(422, 'VALIDATION_ERROR', 'A nova senha deve ser diferente da atual.', {
          newPassword: 'A nova senha deve ser diferente da atual.',
        })
      }
      // Sal novo a cada troca; a senha em si nunca é guardada.
      auth.user.passwordSalt = randomToken()
      auth.user.passwordHash = await hashPassword(auth.user.passwordSalt, next)
      db.persist()
      return new HttpResponse(null, { status: 204 })
    },
  ),
]
