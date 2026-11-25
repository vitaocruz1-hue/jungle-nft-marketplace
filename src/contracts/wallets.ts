import { EMAIL_PATTERN } from './auth'
import { NETWORK_IDS, type NetworkId } from './catalog'

export const WALLET_TYPES = ['metamask', 'walletconnect', 'coinbase'] as const
export type WalletType = (typeof WALLET_TYPES)[number]

export const WALLET_TYPE_LABELS: Record<WalletType, string> = {
  metamask: 'MetaMask',
  walletconnect: 'WalletConnect',
  coinbase: 'Coinbase Wallet',
}

export type WalletSlot = 'primary' | 'secondary'

/** Campos do formulário "Carteiras" do Figma. */
export interface WalletInput {
  displayName: string
  nickname: string
  network: NetworkId
  profileName: string
  address: string
  /** ENS ou carteira secundária (opcional). */
  secondaryAddress: string
  type: WalletType
  referralCode: string
  email: string
  /** Nome ENS sem o sufixo ".eth". */
  ensName: string
}

export interface Wallet extends WalletInput {
  id: string
  slot: WalletSlot
  updatedAt: string
}

/** GET /api/wallets */
export interface WalletsResponse {
  primary: Wallet | null
  secondary: Wallet | null
}

/** POST /api/wallets/:id/connect — conexão simulada com a extensão da carteira. */
export interface WalletConnection {
  walletId: string
  connected: boolean
}

export const WALLET_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/
export const ENS_NAME_PATTERN = /^[a-z0-9-]{3,40}$/
export const REFERRAL_CODE_PATTERN = /^[A-Z0-9]{4,12}$/

export function shortAddress(address: string) {
  return address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address
}

/** Valida os campos do formulário "Carteiras" (mesmas regras do front). */
export function validateWallet(input: Partial<WalletInput>): Record<string, string> {
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
