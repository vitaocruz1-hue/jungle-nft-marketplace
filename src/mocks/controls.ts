import { formatWei, parseEth } from '@/lib/eth'

import { db, resetDb } from './db'
import {
  commitNftChange,
  connectedClients,
  dropConnections,
  emitStaleNftEvent,
  replayLastEvent,
} from './realtime'
import { SCENARIOS, type ScenarioId } from './scenarios'
import { expireAllSessions } from './utils/auth'
import { setSettlementDelay, settlePendingOrders } from './utils/orders'
import { currentPrice } from './utils/nft'

/**
 * Controles do "servidor" simulado, usados pelo painel de cenários e pelos
 * testes (window.__kurioMocks). Toda mudança passa pelo banco simulado e chega
 * ao app pela API REST e pelos eventos Socket.IO — nunca direto na interface.
 */
export const mockControls = {
  scenarios: SCENARIOS,

  /** Restaura o cenário inicial (catálogo, usuários, carrinhos, pedidos). */
  reset() {
    resetDb()
  },

  /** Troca o cenário de rede (vale a partir da próxima requisição). */
  setScenario(id: ScenarioId) {
    sessionStorage.setItem('kurio:mock-scenario', id)
  },

  /** Faz a sessão atual expirar (a próxima chamada autenticada recebe 401). */
  expireSession() {
    expireAllSessions()
  },

  /** Muda o preço de um NFT (todas as edições, na mesma proporção). */
  changeNftPrice(nftId: string, newPrice: string) {
    const nft = db.findNft(nftId)
    if (!nft) return false
    const ratioFrom = parseEth(currentPrice(nft))
    const ratioTo = parseEth(newPrice)
    for (const edition of nft.editions) {
      edition.price = formatWei((parseEth(edition.price) * ratioTo) / ratioFrom)
    }
    commitNftChange(nft)
    return true
  },

  /** Esgota uma edição (ou todas, sem editionId). */
  sellOut(nftId: string, editionId?: string) {
    const nft = db.findNft(nftId)
    if (!nft) return false
    for (const edition of nft.editions) {
      if (!editionId || edition.id === editionId) edition.available = 0
    }
    commitNftChange(nft)
    return true
  },

  /** Quantos pedidos existem (os testes provam que não houve duplicação). */
  ordersCount() {
    return db.state.orders.length
  },

  /** Adia a confirmação dos próximos pedidos (ms). */
  setSettlementDelay,
  /** Confirma/recusa agora os pedidos pendentes (emite order.updated). */
  settlePendingOrders,

  replayLastEvent,
  emitStaleNftEvent,
  dropConnections,
  connectedClients,
}

export type MockControls = typeof mockControls
