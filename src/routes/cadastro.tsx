import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

import { Container } from '@/components/layout/container'
import { AuthPanel } from '@/features/auth/components/auth-panel'
import { RegisterForm } from '@/features/auth/components/register-form'
import { authSearchSchema } from '@/features/auth/search-params'
import { safeRedirect } from '@/features/auth/session'

export const Route = createFileRoute('/cadastro')({
  validateSearch: authSearchSchema,
  head: () => ({ meta: [{ title: 'Criar conta · Kurio' }] }),
  component: RegisterPage,
})

function RegisterPage() {
  const search = Route.useSearch()
  const navigate = useNavigate()

  return (
    <Container className="py-10 sm:py-16">
      <AuthPanel
        mode="register"
        redirect={search.redirect}
        description="Crie seu perfil de colecionador e conecte uma carteira quando quiser."
      >
        <RegisterForm
          onSuccess={() => {
            toast.success('Conta criada! Boas-vindas à Kurio.')
            void navigate({ to: safeRedirect(search.redirect) })
          }}
        />
      </AuthPanel>
    </Container>
  )
}
