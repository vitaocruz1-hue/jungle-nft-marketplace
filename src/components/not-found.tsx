import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'

type NotFoundProps = {
  title?: string
  description?: string
}

export function NotFound({
  title = 'Página não encontrada',
  description = 'O endereço que você acessou não existe ou foi removido.',
}: NotFoundProps) {
  return (
    <section className="grid place-items-center gap-4 py-24 text-center">
      <p className="text-sm font-semibold text-muted-foreground">Erro 404</p>
      <h1 className="type-display">{title}</h1>
      <p className="max-w-md text-muted-foreground">{description}</p>
      <Button asChild>
        <Link to="/">Voltar para o início</Link>
      </Button>
    </section>
  )
}
