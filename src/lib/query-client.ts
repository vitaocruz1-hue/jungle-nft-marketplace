import { QueryClient } from '@tanstack/react-query'

import { ApiError } from '@/lib/api-error'

const MAX_QUERY_RETRIES = 2

/**
 * Política de cache (documentada no ARCHITECTURE.md):
 * - staleTime 30s: dado buscado há menos de 30s é reaproveitado sem nova chamada.
 * - queries repetem só falhas passageiras (rede, timeout, 5xx), até 2x, com
 *   espera crescente. Erros como 404 ou 422 não mudam ao repetir.
 * - mutations NUNCA repetem sozinhas: repetir um "criar pedido" poderia
 *   duplicar a compra. Recuperação de pedidos usa chave de idempotência.
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) =>
          error instanceof ApiError && error.isTransient && failureCount < MAX_QUERY_RETRIES,
      },
      mutations: {
        retry: false,
      },
    },
  })
}
