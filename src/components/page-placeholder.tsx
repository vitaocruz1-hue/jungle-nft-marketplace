import { Container } from '@/components/layout/container'

/** Página provisória de uma tela ainda em construção. */
export function PagePlaceholder({ title }: { title: string }) {
  return (
    <Container className="py-16">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="mt-3 text-muted-foreground">Tela em construção.</p>
    </Container>
  )
}
