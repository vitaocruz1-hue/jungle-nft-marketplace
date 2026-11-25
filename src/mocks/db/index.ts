import { createNftFixtures, type NftRecord } from './fixtures/nfts'

/**
 * "Banco de dados" da API simulada.
 * Fica em memória e é salvo no localStorage para sobreviver ao F5.
 * `resetDb()` restaura exatamente o cenário inicial (fixtures).
 */

const STORAGE_KEY = 'kurio:mock-db'
/** Mude ao alterar o formato do estado: dados antigos são descartados. */
const SCHEMA_VERSION = 1

export interface DbState {
  schemaVersion: number
  nfts: NftRecord[]
}

function createInitialState(): DbState {
  return { schemaVersion: SCHEMA_VERSION, nfts: createNftFixtures() }
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
  get nfts() {
    return state.nfts
  },
  findNft(id: string) {
    return state.nfts.find((nft) => nft.id === id)
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
