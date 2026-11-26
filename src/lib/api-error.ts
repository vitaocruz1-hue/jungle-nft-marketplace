import { AxiosHeaders, isAxiosError } from 'axios'

import type { ApiErrorBody, ApiErrorCode } from '@/contracts/common'

export type ClientErrorCode =
  | ApiErrorCode
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'CANCELED'
  | 'UNKNOWN'
  /** A resposta chegou, mas não tem o formato do contrato (validação com zod). */
  | 'INVALID_RESPONSE'
  /** A API simulada (MSW) não conseguiu controlar esta aba. */
  | 'MOCKS_UNAVAILABLE'

/**
 * Erro único que o app recebe de qualquer chamada à API.
 * As telas olham `code` (o que aconteceu) e `isTransient` (vale tentar de novo?).
 */
export class ApiError extends Error {
  readonly status: number | null
  readonly code: ClientErrorCode
  readonly fieldErrors: Record<string, string>

  constructor(params: {
    message: string
    status: number | null
    code: ClientErrorCode
    fieldErrors?: Record<string, string>
  }) {
    super(params.message)
    this.name = 'ApiError'
    this.status = params.status
    this.code = params.code
    this.fieldErrors = params.fieldErrors ?? {}
  }

  /** Falhas passageiras: sem conexão, tempo esgotado, servidor indisponível. */
  get isTransient(): boolean {
    return (
      this.code === 'NETWORK_ERROR' ||
      this.code === 'TIMEOUT' ||
      this.status === 502 ||
      this.status === 503 ||
      this.status === 504 ||
      this.status === 500
    )
  }
}

/**
 * A API sempre responde JSON. Outro tipo de conteúdo (ex.: o index.html que a
 * hospedagem devolve quando a API simulada não está ativa) não é resposta da API.
 */
export function hasJsonContentType(headers: unknown): boolean {
  let value: unknown
  if (headers instanceof AxiosHeaders) value = headers.get('content-type')
  else if (headers && typeof headers === 'object') {
    value = (headers as Record<string, unknown>)['content-type']
  }
  return typeof value === 'string' && /\bapplication\/(?:[\w.+-]+\+)?json\b/i.test(value)
}

export function notJsonError() {
  return new ApiError({
    message: 'Não foi possível falar com a API (resposta inesperada). Tente novamente.',
    status: null,
    code: 'NETWORK_ERROR',
  })
}

/** A API simulada não está ativa nesta aba (ver `startMockWorker`). */
export function mocksUnavailableError() {
  return new ApiError({
    message:
      'A API de demonstração não está ativa nesta aba. Recarregue a página para voltar a usar o site.',
    status: null,
    code: 'MOCKS_UNAVAILABLE',
  })
}

function isApiErrorBody(data: unknown): data is ApiErrorBody {
  return (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    typeof (data as ApiErrorBody).error?.code === 'string'
  )
}

/** Converte qualquer falha do Axios em ApiError. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (isAxiosError(error)) {
    if (error.code === 'ERR_CANCELED') {
      return new ApiError({ message: 'Requisição cancelada', status: null, code: 'CANCELED' })
    }
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new ApiError({
        message: 'O servidor demorou para responder. Tente novamente.',
        status: null,
        code: 'TIMEOUT',
      })
    }
    if (!error.response) {
      return new ApiError({
        message: 'Sem conexão com o servidor. Verifique sua internet e tente novamente.',
        status: null,
        code: 'NETWORK_ERROR',
      })
    }
    const { status, data, headers } = error.response
    // Erro sem JSON (ex.: página 404 da hospedagem): a API nem foi alcançada.
    if (!hasJsonContentType(headers)) return notJsonError()
    if (isApiErrorBody(data)) {
      return new ApiError({
        message: data.error.message,
        status,
        code: data.error.code,
        fieldErrors: data.error.fieldErrors,
      })
    }
    return new ApiError({
      message: 'Algo deu errado. Tente novamente.',
      status,
      code: status >= 500 ? 'INTERNAL_ERROR' : 'UNKNOWN',
    })
  }

  return new ApiError({ message: 'Erro inesperado.', status: null, code: 'UNKNOWN' })
}

/** Mensagem amigável para exibir ao usuário. */
export function getErrorMessage(error: unknown): string {
  return toApiError(error).message
}
