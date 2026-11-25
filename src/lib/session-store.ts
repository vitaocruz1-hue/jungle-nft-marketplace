/**
 * Guarda o token da sessão e o id do carrinho de visitante no navegador
 * (sobrevivem ao F5) e avisa quem estiver ouvindo quando o token muda.
 * Senha nunca é guardada: só o token opaco devolvido pela API.
 */

const TOKEN_KEY = 'kurio:session-token'
const GUEST_CART_KEY = 'kurio:guest-cart-id'

type Listener = () => void
const listeners = new Set<Listener>()

function read(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export const sessionStore = {
  getToken: () => read(TOKEN_KEY),
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token)
    listeners.forEach((listener) => listener())
  },
  clearToken() {
    localStorage.removeItem(TOKEN_KEY)
    listeners.forEach((listener) => listener())
  },
  /** Para o useSyncExternalStore do React. */
  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },

  getGuestCartId: () => read(GUEST_CART_KEY),
  setGuestCartId: (id: string) => localStorage.setItem(GUEST_CART_KEY, id),
  clearGuestCartId: () => localStorage.removeItem(GUEST_CART_KEY),
}

/** Evento "a sessão acabou" (token expirado/inválido em qualquer chamada). */
type SessionEndedListener = (reason: 'expired') => void
const sessionEndedListeners = new Set<SessionEndedListener>()

export function onSessionEnded(listener: SessionEndedListener) {
  sessionEndedListeners.add(listener)
  return () => {
    sessionEndedListeners.delete(listener)
  }
}

export function notifySessionEnded() {
  sessionEndedListeners.forEach((listener) => listener('expired'))
}
