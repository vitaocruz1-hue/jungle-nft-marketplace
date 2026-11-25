import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'

import { Container } from '@/components/layout/container'
import { AuthPanel } from '@/features/auth/components/auth-panel'
import { LoginForm } from '@/features/auth/components/login-form'
import { authSearchSchema } from '@/features/auth/search-params'
import { safeRedirect, sessionQueryOptions } from '@/features/auth/session'
import { sessionStore } from '@/lib/session-store'

export const Route = createFileRoute('/login')({
  validateSearch: authSearchSchema,
  // Já logado? Vai direto para o destino.
  beforeLoad: async ({ context, search }) => {
    const token = sessionStore.getToken()
    if (!token) return
    const session = await context.queryClient
      .ensureQueryData(sessionQueryOptions(token))
      .catch(() => null)
    if (session) throw redirect({ to: safeRedirect(search.redirect) })
  },
  head: () => ({ meta: [{ title: 'Entrar · Kurio' }] }),
  component: LoginPage,
})

function LoginPage() {
  const search = Route.useSearch()
  const navigate = useNavigate()

  return (
    <Container className="py-10 sm:py-16">
      {search.motivo === 'expirada' && (
        <p
          role="status"
          className="mx-auto mb-6 max-w-[500px] rounded-sm border border-primary/60 bg-secondary px-4 py-3 text-sm"
        >
          Sua sessão expirou. Entre novamente para continuar de onde parou.
        </p>
      )}
      <AuthPanel
        mode="login"
        redirect={search.redirect}
        description="Entre para gerenciar sua carteira, coleção e perfil de criador."
      >
        <LoginForm onSuccess={() => void navigate({ to: safeRedirect(search.redirect) })} />
      </AuthPanel>
    </Container>
  )
}
