import { HttpResponse } from 'msw'

import { env } from '@/config/env'
import type { ApiErrorBody, ApiErrorCode } from '@/contracts/common'

/** Caminho completo de um endpoint: apiUrl('/nfts') → '/api/nfts'. */
export function apiUrl(path: string) {
  return `${env.apiBaseUrl}${path}`
}

/** Resposta de erro no formato do contrato (ApiErrorBody). */
export function errorResponse(
  status: number,
  code: ApiErrorCode,
  message: string,
  fieldErrors?: Record<string, string>,
) {
  return HttpResponse.json<ApiErrorBody>({ error: { code, message, fieldErrors } }, { status })
}

/** Lê o corpo JSON da requisição; corpo inválido vira null (a rota responde 422). */
export async function readJson<T>(request: Request): Promise<Partial<T> | null> {
  try {
    return (await request.json()) as Partial<T>
  } catch {
    return null
  }
}
