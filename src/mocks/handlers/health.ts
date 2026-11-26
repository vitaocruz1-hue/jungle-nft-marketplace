import { http, HttpResponse } from 'msw'

import { apiUrl } from '../utils/http'

/** Endereço que só a API simulada responde (prova de que o MSW controla a aba). */
export const HEALTH_PATH = '/__mock-health'

/**
 * Fica antes de tudo (inclusive dos cenários de falha): a prova de vida mede se
 * o MSW está interceptando, não a "rede" simulada.
 */
export const healthHandlers = [
  http.get(apiUrl(HEALTH_PATH), () => HttpResponse.json({ mock: 'kurio' })),
]
