import type { RequestHandler } from 'msw'

/**
 * Todas as rotas da API simulada. Cada domínio (catálogo, carrinho,
 * pedidos...) terá seu próprio arquivo nesta pasta, reunido aqui.
 */
export const handlers: RequestHandler[] = []
