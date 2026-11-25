import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import { sessionQueryOptions } from '@/features/auth/session'
import { sessionStore } from '@/lib/session-store'

/**
 * Layout das telas privadas (perfil, carteiras, pagamento, pedidos).
 * Sem sessão válida → /login?redirect=<página pedida>, para voltar depois.
 */
export const Route = createFileRoute('/_auth')({
  beforeLoad: async ({ context, location }) => {
    const token = sessionStore.getToken()
    const session = token
      ? await context.queryClient.ensureQueryData(sessionQueryOptions(token)).catch(() => null)
      : null
    if (!session) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
    return { user: session.user }
  },
  component: Outlet,
})
