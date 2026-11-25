import type { RequestHandler, WebSocketHandler } from 'msw'

import { realtimeHandlers } from '../realtime'
import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { catalogHandlers } from './catalog'
import { failureHandlers } from './failures'
import { favoritesHandlers } from './favorites'
import { ordersHandlers } from './orders'
import { profileHandlers } from './profile'
import { walletsHandlers } from './wallets'

/**
 * Todas as rotas da API simulada. Cada domínio tem seu próprio arquivo.
 * `failureHandlers` vem primeiro: simula falhas de rede conforme o cenário.
 */
export const handlers: Array<RequestHandler | WebSocketHandler> = [
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
