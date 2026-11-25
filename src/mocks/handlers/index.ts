import type { RequestHandler } from 'msw'

import { catalogHandlers } from './catalog'

/**
 * Todas as rotas da API simulada. Cada domínio (catálogo, carrinho,
 * pedidos...) tem seu próprio arquivo nesta pasta, reunido aqui.
 */
export const handlers: RequestHandler[] = [...catalogHandlers]
