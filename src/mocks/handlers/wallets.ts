import { http, HttpResponse, type DefaultBodyType, type PathParams } from 'msw'

import { EMAIL_PATTERN } from '@/contracts/auth'
import { NETWORK_IDS } from '@/contracts/catalog'
import type { ApiErrorBody } from '@/contracts/common'
import {
  ENS_NAME_PATTERN,
  REFERRAL_CODE_PATTERN,
  WALLET_ADDRESS_PATTERN,
  WALLET_TYPES,
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

/** Valida os campos do formulário "Carteiras" (mesmas regras do front). */
export function validateWallet(input: Partial<WalletInput>) {
  const errors: Record<string, string> = {}
  if (!input.displayName?.trim()) errors.displayName = 'Informe o nome de exibição.'
  if (!input.nickname?.trim()) errors.nickname = 'Informe um apelido para a carteira.'
  if (!input.network || !NETWORK_IDS.includes(input.network)) errors.network = 'Selecione uma rede.'
  if (!input.profileName?.trim()) errors.profileName = 'Informe o nome do perfil.'
  if (!input.address || !WALLET_ADDRESS_PATTERN.test(input.address))
    errors.address = 'Use um endereço 0x com 40 caracteres hexadecimais.'
  if (
    input.secondaryAddress &&
    !WALLET_ADDRESS_PATTERN.test(input.secondaryAddress) &&
    !input.secondaryAddress.endsWith('.eth')
  )
    errors.secondaryAddress = 'Use um endereço 0x ou um nome .eth.'
  if (!input.type || !WALLET_TYPES.includes(input.type))
    errors.type = 'Selecione o tipo de carteira.'
  if (!input.referralCode || !REFERRAL_CODE_PATTERN.test(input.referralCode))
    errors.referralCode = 'Use de 4 a 12 letras maiúsculas ou números.'
  if (!input.email || !EMAIL_PATTERN.test(input.email)) errors.email = 'Informe um e-mail válido.'
  if (!input.ensName || !ENS_NAME_PATTERN.test(input.ensName))
    errors.ensName = 'Use de 3 a 40 letras minúsculas, números ou hífen.'
  return errors
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
