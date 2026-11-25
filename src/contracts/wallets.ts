import type { NetworkId } from './catalog'

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
