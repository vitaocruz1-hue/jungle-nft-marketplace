import { createFileRoute, stripSearchParams } from '@tanstack/react-router'

import { Container } from '@/components/layout/container'
import { CatalogSection } from '@/features/catalog/components/catalog-section'
import { featuredQueryOptions, nftListQueryOptions } from '@/features/catalog/queries'
import {
  CATALOG_SEARCH_DEFAULTS,
  catalogSearchSchema,
  toListParams,
} from '@/features/catalog/search-params'
import { Hero } from '@/features/home/components/hero'
import { Journal } from '@/features/home/components/journal'
import { PromoBanners } from '@/features/home/components/promo-banners'

export const Route = createFileRoute('/')({
  // Busca, filtros, ordem e página vivem na URL: sobrevivem ao F5 e ao "voltar".
  validateSearch: catalogSearchSchema,
  search: { middlewares: [stripSearchParams(CATALOG_SEARCH_DEFAULTS)] },
  loaderDeps: ({ search }) => search,
  // Começa a buscar já na navegação (ou ao passar o mouse num link), sem
  // bloquear a tela: os skeletons aparecem enquanto os dados chegam.
  loader: ({ context: { queryClient }, deps }) => {
    void queryClient.prefetchQuery(nftListQueryOptions(toListParams(deps)))
    void queryClient.prefetchQuery(featuredQueryOptions())
  },
  component: HomePage,
})

function HomePage() {
  return (
    <Container>
      <Hero />
      <CatalogSection />
      <PromoBanners />
      <Journal />
    </Container>
  )
}
