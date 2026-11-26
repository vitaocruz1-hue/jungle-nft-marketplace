import type { z } from 'zod'

import { ApiError } from '@/lib/api-error'

/**
 * Confere uma resposta da API com o esquema (zod) do contrato.
 * Formato inesperado vira ApiError ("INVALID_RESPONSE"): a tela mostra o erro
 * com "Tentar novamente" em vez de quebrar ao ler um campo que não existe.
 */
export function parseResponse<T>(schema: z.ZodType<T>, data: unknown, endpoint: string): T {
  const result = schema.safeParse(data)
  if (result.success) return result.data
  if (import.meta.env.DEV) console.error(`Resposta fora do contrato em ${endpoint}`, result.error)
  throw new ApiError({
    message: 'A API respondeu em um formato inesperado. Tente novamente em instantes.',
    status: null,
    code: 'INVALID_RESPONSE',
  })
}
