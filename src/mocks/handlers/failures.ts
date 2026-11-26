import { http, HttpResponse } from 'msw'

import { MOCK_RESPONSE_HEADER } from '@/contracts/common'

import { getActiveScenario } from '../scenarios'
import { apiUrl, errorResponse } from '../utils/http'

let unstableFailures = 0

/** Leituras principais: catálogo, destaques, detalhe, carrinho e sessão. */
function isMainRead(method: string, pathname: string) {
  return (
    method === 'GET' &&
    (pathname.includes('/nfts') ||
      pathname.endsWith('/featured') ||
      pathname.endsWith('/cart') ||
      pathname.endsWith('/auth/session'))
  )
}

/** O que a hospedagem devolve quando /api cai no rewrite da SPA: o index.html, com status 200. */
const SPA_HTML =
  '<!doctype html><html lang="pt-BR"><head><title>Kurio</title></head><body><div id="root"></div></body></html>'

/**
 * Falhas globais de rede, conforme o cenário ativo. Fica ANTES dos outros
 * handlers: quando não retorna nada, a requisição segue para o handler normal.
 */
export const failureHandlers = [
  http.all(apiUrl('/*'), ({ request }) => {
    const scenario = getActiveScenario()
    const { pathname } = new URL(request.url)

    if (scenario === 'offline') return HttpResponse.error()

    if (scenario === 'erro-servidor' && request.method === 'GET') {
      if (pathname.includes('/nfts')) {
        return errorResponse(500, 'INTERNAL_ERROR', 'Erro interno no servidor do catálogo.')
      }
      // Listas da conta (a sessão e o detalhe de um pedido continuam funcionando).
      if (pathname.endsWith('/favorites') || pathname.endsWith('/orders')) {
        return errorResponse(500, 'INTERNAL_ERROR', 'Erro interno no servidor.')
      }
    }

    if (scenario === 'api-html' && isMainRead(request.method, pathname)) {
      return new HttpResponse(SPA_HTML, {
        status: 200,
        headers: { 'Content-Type': 'text/html', [MOCK_RESPONSE_HEADER]: '1' },
      })
    }

    // JSON válido, mas sem os campos do contrato (ex.: `items` nulo na lista).
    if (scenario === 'formato-invalido' && isMainRead(request.method, pathname)) {
      return HttpResponse.json({ items: null, user: null, editions: 'indisponível' })
    }

    if (scenario === 'instavel' && request.method === 'GET' && unstableFailures < 2) {
      unstableFailures += 1
      return errorResponse(503, 'SERVICE_UNAVAILABLE', 'Serviço temporariamente indisponível.')
    }

    return undefined
  }),
]
