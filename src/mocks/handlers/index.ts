import type { RequestHandler } from 'msw'

import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { catalogHandlers } from './catalog'
import { favoritesHandlers } from './favorites'

/**
 * Todas as rotas da API simulada. Cada domínio (catálogo, carrinho,
 * pedidos...) tem seu próprio arquivo nesta pasta, reunido aqui.
 */
export const handlers: RequestHandler[] = [
  ...authHandlers,
  ...catalogHandlers,
  ...cartHandlers,
  ...favoritesHandlers,
]
