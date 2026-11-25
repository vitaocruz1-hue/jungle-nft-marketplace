/**
 * Tipos compartilhados entre a API (simulada pelo MSW) e o app.
 * Mudou aqui, o TypeScript aponta todos os lugares afetados dos dois lados.
 */

/**
 * Valor em ETH como string decimal (ex.: "1.19").
 * Nunca usar `number`: 0.1 + 0.2 !== 0.3 em ponto flutuante.
 * Cálculos usam `@/lib/eth` (BigInt, 18 casas decimais).
 */
export type EthAmount = string

/** Data/hora em ISO 8601 (UTC). */
export type IsoDateTime = string

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'SESSION_EXPIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'OUT_OF_STOCK'
  | 'PRICE_CHANGED'
  | 'COUPON_INVALID'
  | 'COUPON_EXPIRED'
  | 'QUOTE_EXPIRED'
  | 'IDEMPOTENCY_CONFLICT'
  | 'PAYMENT_DECLINED'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'

/** Corpo de toda resposta de erro da API. */
export interface ApiErrorBody {
  error: {
    code: ApiErrorCode
    message: string
    /** Erros por campo de formulário (ex.: { email: 'E-mail já cadastrado' }). */
    fieldErrors?: Record<string, string>
  }
}

export interface Paginated<T> {
  items: T[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}
