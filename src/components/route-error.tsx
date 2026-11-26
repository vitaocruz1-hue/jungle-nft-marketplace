import { useQueryClient } from '@tanstack/react-query'
import { Link, useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { AlertTriangleIcon, DatabaseBackupIcon, RotateCwIcon } from 'lucide-react'

import { Container } from '@/components/layout/container'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api-error'
import { getNetworkStatus } from '@/lib/network-ready'
import { restoreDemoData } from '@/lib/restore-demo-data'

const GENERIC_MESSAGE =
  'Ocorreu um erro inesperado ao exibir esta página. Tente de novo ou restaure os dados de demonstração.'

interface RouteErrorProps extends Pick<ErrorComponentProps, 'error' | 'reset'> {
  title?: string
}

/**
 * Página de erro do site (raiz e rotas), no lugar da tela genérica do roteador.
 * "Tentar novamente" busca de novo só o que falhou; "Restaurar dados de
 * demonstração" resolve até dados salvos que ficaram inválidos.
 */
export function RouteError({
  error,
  reset,
  title = 'Algo não saiu como esperado',
}: RouteErrorProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const message = error instanceof ApiError ? error.message : GENERIC_MESSAGE

  function retry() {
    // Sem a API simulada nesta aba, buscar de novo não adianta: recarrega.
    if (getNetworkStatus() === 'unavailable') {
      window.location.reload()
      return
    }
    void queryClient.resetQueries({ predicate: (query) => query.state.status === 'error' })
    reset()
    void router.invalidate()
  }

  return (
    <section
      aria-labelledby="erro-titulo"
      className="mx-auto grid max-w-xl place-items-center gap-4 py-20 text-center"
    >
      <AlertTriangleIcon aria-hidden="true" className="size-10 text-destructive" />
      <h1 id="erro-titulo" className="type-display">
        {title}
      </h1>
      <p role="alert" className="measure type-body text-muted-foreground">
        {message}
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Button onClick={retry}>
          <RotateCwIcon />
          Tentar novamente
        </Button>
        <Button variant="outline" onClick={restoreDemoData}>
          <DatabaseBackupIcon />
          Restaurar dados de demonstração
        </Button>
      </div>
      <p className="measure type-caption text-muted-foreground">
        Restaurar volta o catálogo, as contas, os carrinhos e os pedidos ao estado inicial e
        recarrega a página.
      </p>
      <Link to="/" className="type-body font-bold text-highlight hover:underline">
        Voltar para o início
      </Link>
    </section>
  )
}

/** Erro numa rota: aparece dentro do layout (cabeçalho e rodapé continuam). */
export function RouteErrorPage(props: ErrorComponentProps) {
  return (
    <Container>
      <RouteError {...props} />
    </Container>
  )
}

/**
 * Erro no próprio layout (raiz): o cabeçalho pode ser a causa, então a página
 * traz só a marca, sem depender do resto do layout.
 */
export function RootErrorPage(props: ErrorComponentProps) {
  return (
    <>
      <header>
        <Container>
          <div className="flex h-[69px] items-center border-b border-[#8b5b33]/70">
            <a
              href="/"
              className="text-base font-bold tracking-wide"
              aria-label="Kurio, página inicial"
            >
              KURIO
            </a>
          </div>
        </Container>
      </header>
      <main id="conteudo">
        <Container>
          <RouteError {...props} />
        </Container>
      </main>
    </>
  )
}
