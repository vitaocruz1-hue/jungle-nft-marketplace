import { http, HttpResponse, type DefaultBodyType, type PathParams } from 'msw'

import type { ApiErrorBody } from '@/contracts/common'
import {
  validateWallet,
  type Wallet,
  type WalletConnection,
  type WalletInput,
  type WalletSlot,
  type WalletsResponse,
} from '@/contracts/wallets'

import { db } from '../db'
import { getActiveScenario, simulateNetwork } from '../scenarios'
import { requireAuth } from '../utils/auth'
import { apiUrl, errorResponse, readJson } from '../utils/http'

function walletsOf(userId: string) {
  db.state.wallets[userId] ??= { primary: null, secondary: null }
  return db.state.wallets[userId]
}

export const walletsHandlers = [
  http.get<PathParams, DefaultBodyType, WalletsResponse | ApiErrorBody>(
    apiUrl('/wallets'),
    async ({ request }) => {
      await simulateNetwork()
      const auth = requireAuth(request)
      if (!auth.ok) return auth.response
      return HttpResponse.json({ ...walletsOf(auth.user.id) })
    },
  ),

  http.put<{ slot: string }, DefaultBodyType, Wallet | ApiErrorBody>(
    apiUrl('/wallets/:slot'),
    async ({ request, params }) => {
      await simulateNetwork()
      const auth = requireAuth(request)
      if (!auth.ok) return auth.response
      const slot = params.slot as WalletSlot
      if (slot !== 'primary' && slot !== 'secondary') {
        return errorResponse(404, 'NOT_FOUND', 'Carteira inexistente.')
      }
      const input = (await readJson<WalletInput>(request)) ?? {}
      const errors = validateWallet(input)
      if (Object.keys(errors).length > 0) {
        return errorResponse(422, 'VALIDATION_ERROR', 'Revise os campos da carteira.', errors)
      }
      const wallets = walletsOf(auth.user.id)
      const wallet: Wallet = {
        ...(input as WalletInput),
        referralCode: (input.referralCode ?? '').toUpperCase(),
        id: wallets[slot]?.id ?? db.nextId(`wallet-${slot}`),
        slot,
        updatedAt: new Date().toISOString(),
      }
      wallets[slot] = wallet
      db.persist()
      return HttpResponse.json(wallet)
    },
  ),

  /** Conexão simulada com a extensão da carteira (aceita ou recusada). */
  http.post<{ walletId: string }, DefaultBodyType, WalletConnection | ApiErrorBody>(
    apiUrl('/wallets/:walletId/connect'),
    async ({ request, params }) => {
      await simulateNetwork()
      const auth = requireAuth(request)
      if (!auth.ok) return auth.response
      const wallets = walletsOf(auth.user.id)
      const wallet = [wallets.primary, wallets.secondary].find((w) => w?.id === params.walletId)
      if (!wallet) return errorResponse(404, 'NOT_FOUND', 'Carteira não encontrada.')
      if (getActiveScenario() === 'carteira-recusa') {
        return errorResponse(403, 'FORBIDDEN', 'A conexão foi recusada na carteira.')
      }
      return HttpResponse.json({ walletId: wallet.id, connected: true })
    },
  ),
]
