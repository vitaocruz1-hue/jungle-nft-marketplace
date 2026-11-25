import type { Order, Quote } from '@/contracts/orders'
import type { Wallet } from '@/contracts/wallets'

import { createNftFixtures, type NftRecord } from './fixtures/nfts'
import { createUserFixtures, type UserRecord } from './fixtures/users'
import { createWalletFixtures } from './fixtures/wallets'

/**
 * "Banco de dados" da API simulada.
 * Fica em memória e é salvo no localStorage para sobreviver ao F5.
 * `resetDb()` restaura exatamente o cenário inicial (fixtures).
 */

const STORAGE_KEY = 'kurio:mock-db'
/** Mude ao alterar o formato do estado: dados antigos são descartados. */
const SCHEMA_VERSION = 8

export interface SessionRecord {
  token: string
  userId: string
  expiresAt: string
}

export interface CartLineRecord {
  id: string
  nftId: string
  editionId: string
  quantity: number
  addedUnitPrice: string
}

export interface CartRecord {
  id: string
  /** null = carrinho de visitante. */
  userId: string | null
  lines: CartLineRecord[]
  couponCode: string | null
  updatedAt: string
}

export interface QuoteRecord extends Quote {
  userId: string
}

export interface OrderRecord extends Order {
  userId: string
  idempotencyKey: string
  /** Assinatura do corpo da requisição: mesma chave + corpo diferente = conflito. */
  requestHash: string
  /** Quando a simulação decide o resultado (confirmado/recusado). */
  settleAt: string
  /** Resultado decidido na criação (cenário ativo naquele momento). */
  outcome: 'confirmed' | 'declined'
}

export interface UserWallets {
  primary: Wallet | null
  secondary: Wallet | null
}

export interface DbState {
  schemaVersion: number
  nfts: NftRecord[]
  users: UserRecord[]
  sessions: SessionRecord[]
  carts: CartRecord[]
  favorites: Record<string, string[]>
  wallets: Record<string, UserWallets>
  quotes: QuoteRecord[]
  orders: OrderRecord[]
  /** Contador para gerar ids legíveis e determinísticos. */
  sequence: number
}

function createInitialState(): DbState {
  return {
    schemaVersion: SCHEMA_VERSION,
    nfts: createNftFixtures(),
    users: createUserFixtures(),
    sessions: [],
    carts: [],
    favorites: { 'user-ana': ['sage-nomad-009'], 'user-bruno': [] },
    wallets: createWalletFixtures(),
    quotes: [],
    orders: [],
    sequence: 1,
  }
}

function load(): DbState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as DbState
      if (parsed.schemaVersion === SCHEMA_VERSION) return parsed
    }
  } catch {
    // Dado corrompido: volta ao cenário inicial.
  }
  return createInitialState()
}

let state: DbState = load()

export const db = {
  get state() {
    return state
  },
  findNft(id: string) {
    return state.nfts.find((nft) => nft.id === id)
  },
  /** Id único e previsível (ex.: "cart-12"). */
  nextId(prefix: string) {
    state.sequence += 1
    return `${prefix}-${state.sequence}`
  },
  /** Salva no localStorage após qualquer alteração. */
  persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  },
}

export function resetDb() {
  state = createInitialState()
  db.persist()
}
