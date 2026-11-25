import { http, HttpResponse } from 'msw'

import { getActiveScenario } from '../scenarios'
import { apiUrl, errorResponse } from '../utils/http'

let unstableFailures = 0

/**
 * Falhas globais de rede, conforme o cenário ativo. Fica ANTES dos outros
 * handlers: quando não retorna nada, a requisição segue para o handler normal.
 */
export const failureHandlers = [
  http.all(apiUrl('/*'), ({ request }) => {
    const scenario = getActiveScenario()
    const { pathname } = new URL(request.url)

    if (scenario === 'offline') return HttpResponse.error()

    if (scenario === 'erro-servidor' && request.method === 'GET' && pathname.includes('/nfts')) {
      return errorResponse(500, 'INTERNAL_ERROR', 'Erro interno no servidor do catálogo.')
    }

    if (scenario === 'instavel' && request.method === 'GET' && unstableFailures < 2) {
      unstableFailures += 1
      return errorResponse(503, 'SERVICE_UNAVAILABLE', 'Serviço temporariamente indisponível.')
    }

    return undefined
  }),
]
