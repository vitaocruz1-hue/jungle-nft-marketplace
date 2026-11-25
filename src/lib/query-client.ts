import { QueryClient } from '@tanstack/react-query'

/**
 * Política de cache inicial (será refinada e documentada no ARCHITECTURE.md):
 * - staleTime 30s: um dado buscado há menos de 30s é reaproveitado sem nova chamada.
 * - queries tentam de novo até 2x em caso de falha.
 * - mutations NUNCA repetem sozinhas: repetir um "criar pedido" poderia
 *   duplicar a compra. Recuperação de pedidos usa chave de idempotência.
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 2,
      },
      mutations: {
        retry: false,
      },
    },
  })
}
