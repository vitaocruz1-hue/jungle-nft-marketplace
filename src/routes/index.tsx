import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <section aria-labelledby="titulo-inicio">
      <h1 id="titulo-inicio" className="text-3xl font-bold">
        Descubra NFTs
      </h1>
      <p className="mt-2 text-muted-foreground">O catálogo será implementado no próximo passo.</p>
    </section>
  )
}
