import type { RealtimeEvent } from '@/contracts/realtime'

const MAX_REMEMBERED_EVENTS = 500

/**
 * Filtro de eventos: aceita cada evento uma única vez e nunca um evento com
 * versão menor ou igual à última aplicada para o mesmo recurso.
 * Assim duplicatas e eventos atrasados não "voltam no tempo".
 */
export function createEventFilter() {
  const seen = new Set<string>()
  const versions = new Map<string, number>()

  return {
    accept(event: RealtimeEvent) {
      if (seen.has(event.eventId)) return false
      seen.add(event.eventId)
      if (seen.size > MAX_REMEMBERED_EVENTS) {
        const oldest = seen.values().next().value
        if (oldest) seen.delete(oldest)
      }
      const key = `${event.resource.type}:${event.resource.id}`
      const last = versions.get(key) ?? 0
      if (event.version <= last) return false
      versions.set(key, event.version)
      return true
    },
  }
}
