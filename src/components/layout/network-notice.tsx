import { RotateCwIcon, ServerOffIcon } from 'lucide-react'

import { Container } from '@/components/layout/container'
import { Button } from '@/components/ui/button'
import { useNetworkStatus } from '@/lib/use-network-status'

/**
 * Aviso no topo quando a API simulada (MSW) não controla a aba, mesmo depois
 * do recarregamento automático. Nenhuma chamada sai nesse estado: as telas
 * mostram o erro com opção de recarregar, nunca dados errados.
 */
export function NetworkNotice() {
  const status = useNetworkStatus()
  if (status !== 'unavailable') return null

  return (
    <div role="alert" className="border-b border-destructive/50 bg-card">
      <Container className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-3">
          <ServerOffIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div>
            <p className="type-title">A API de demonstração não está ativa nesta aba</p>
            <p className="mt-1 measure type-body text-muted-foreground">
              Isso acontece depois de um recarregamento forçado (Ctrl+Shift+R) ou com o service
              worker ignorado no DevTools. Recarregue a página para voltar a usar o site.
            </p>
          </div>
        </div>
        <Button
          onClick={() => window.location.reload()}
          className="shrink-0 self-start md:self-auto"
        >
          <RotateCwIcon />
          Recarregar página
        </Button>
      </Container>
    </div>
  )
}
