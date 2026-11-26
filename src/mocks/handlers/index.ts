import type { RequestHandler, WebSocketHandler } from 'msw'

import { realtimeHandlers } from '../realtime'
import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { catalogHandlers } from './catalog'
import { failureHandlers } from './failures'
import { favoritesHandlers } from './favorites'
import { healthHandlers } from './health'
import { ordersHandlers } from './orders'
import { profileHandlers } from './profile'
import { walletsHandlers } from './wallets'

/**
 * Todas as rotas da API simulada. Cada domínio tem seu próprio arquivo.
 * `healthHandlers` vem primeiro (prova de que o MSW controla a aba) e depois
 * `failureHandlers`, que simula falhas de rede conforme o cenário.
 */
export const handlers: Array<RequestHandler | WebSocketHandler> = [
  ...healthHandlers,
  ...failureHandlers,
  ...authHandlers,
  ...catalogHandlers,
  ...cartHandlers,
  ...favoritesHandlers,
  ...walletsHandlers,
  ...ordersHandlers,
  ...profileHandlers,
  ...realtimeHandlers,
]
