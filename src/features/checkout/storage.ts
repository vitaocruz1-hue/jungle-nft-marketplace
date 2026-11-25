import type { CheckoutBuyer } from '@/contracts/orders'

/**
 * Guarda na aba (sessionStorage):
 * - a chave de idempotência da tentativa atual (uma por cotação), para que
 *   cliques repetidos, timeouts e F5 reutilizem a MESMA chave;
 * - o rascunho do formulário, para retomar após sessão expirada.
 */

const ATTEMPT_KEY = 'kurio:checkout-attempt'
const DRAFT_KEY = 'kurio:checkout-draft'

export function idempotencyKeyFor(quoteId: string) {
  try {
    const saved = JSON.parse(sessionStorage.getItem(ATTEMPT_KEY) ?? 'null') as {
      quoteId: string
      key: string
    } | null
    if (saved?.quoteId === quoteId) return saved.key
  } catch {
    // ignora valor corrompido
  }
  const key = crypto.randomUUID()
  sessionStorage.setItem(ATTEMPT_KEY, JSON.stringify({ quoteId, key }))
  return key
}

export type CheckoutDraft = Partial<CheckoutBuyer> & {
  network?: string
  walletId?: string
}

export function loadDraft(userId: string): CheckoutDraft {
  try {
    const saved = JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? 'null') as {
      userId: string
      draft: CheckoutDraft
    } | null
    return saved?.userId === userId ? saved.draft : {}
  } catch {
    return {}
  }
}

export function saveDraft(userId: string, draft: CheckoutDraft) {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ userId, draft }))
}

export function clearCheckoutStorage() {
  sessionStorage.removeItem(ATTEMPT_KEY)
  sessionStorage.removeItem(DRAFT_KEY)
}
