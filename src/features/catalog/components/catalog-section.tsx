import { useQuery } from '@tanstack/react-query'
import { Link, useSearch } from '@tanstack/react-router'
import { SlidersHorizontalIcon, XIcon } from 'lucide-react'
import { useEffect } from 'react'

import { QueryError } from '@/components/query-error'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

import { setFiltersSheetOpen, useFiltersSheetOpen } from '../filters-sheet-store'
import { nftListQueryOptions } from '../queries'
import { CATALOG_PAGE_SIZE, toListParams } from '../search-params'
import { CatalogFilters } from './catalog-filters'
import { CatalogPagination } from './catalog-pagination'
import { CatalogSort } from './catalog-sort'
import { CatalogToolbar } from './catalog-toolbar'
import { NftCard, NftCardSkeleton } from './nft-card'
import { SpotlightCard } from './spotlight-card'

function resultsLabel(total: number) {
  return total === 1 ? '1 NFT encontrado' : `${total} NFTs encontrados`
}

export function CatalogSection() {
  const search = useSearch({ from: '/' })
  const query = useQuery(nftListQueryOptions(toListParams(search)))
  const filtersOpen = useFiltersSheetOpen()
  const { data } = query
  // Durante o "Tentar novamente" os filtros voltam ao skeleton e chegam junto com o catálogo.
  const filtersUnavailable = query.isError && !data && !query.isFetching

  // Fecha a gaveta ao sair da Início.
  useEffect(() => () => setFiltersSheetOpen(false), [])

  // Tablet: botão na barra do catálogo. Celular: botão ao lado da busca (MobileHomeBar).
  const filtersButton = (
    <Button
      variant="outline"
      aria-haspopup="dialog"
      onClick={() => setFiltersSheetOpen(true)}
      className="h-9 border-border bg-card lg:hidden"
    >
      <SlidersHorizontalIcon />
      Filtros
    </Button>
  )

  const filtersSheet = (
    <Sheet open={filtersOpen} onOpenChange={setFiltersSheetOpen}>
      <SheetContent side="left" className="w-[320px] gap-0 overflow-y-auto bg-background p-0">
        <SheetHeader className="px-5">
          <SheetTitle>Filtros</SheetTitle>
          <SheetDescription className="sr-only">Refine o catálogo de NFTs</SheetDescription>
        </SheetHeader>
        <CatalogSort
          id="ordenar-gaveta"
          value={search.sort}
          className="px-5 pb-4 md:hidden"
          triggerClassName="flex-1 justify-between border border-border bg-card"
        />
        <CatalogFilters facets={data?.facets} search={search} unavailable={filtersUnavailable} />
        <SheetFooter className="sticky bottom-0 bg-background">
          <Button onClick={() => setFiltersSheetOpen(false)} className="h-10">
            Ver {data ? resultsLabel(data.totalItems) : 'resultados'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )

  return (
    <section
      id="catalogo"
      aria-labelledby="catalogo-titulo"
      className="mt-6 grid gap-8 md:mt-16 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[310px_minmax(0,1fr)] xl:gap-12"
    >
      <h2 id="catalogo-titulo" className="sr-only">
        Catálogo de NFTs
      </h2>

      <aside aria-label="Filtros do catálogo" className="hidden space-y-8 lg:block">
        <CatalogFilters facets={data?.facets} search={search} unavailable={filtersUnavailable} />
        <SpotlightCard />
      </aside>

      <div className="min-w-0">
        <CatalogToolbar search={search} filtersButton={filtersButton} />

        {search.search && (
          <p className="mt-6 flex flex-wrap items-center gap-2 text-sm">
            Resultados para <strong className="text-highlight">“{search.search}”</strong>
            <Link
              from="/"
              to="/"
              search={(prev) => ({ ...prev, search: undefined, page: undefined })}
              resetScroll={false}
              className="inline-flex items-center gap-1 rounded-sm border border-border px-2 py-0.5 hover:border-primary"
            >
              <XIcon aria-hidden="true" className="size-3.5" />
              Limpar busca
            </Link>
          </p>
        )}

        {/* Anúncio para leitores de tela quando o resultado muda. */}
        <p aria-live="polite" className="sr-only">
          {data && !query.isPlaceholderData ? resultsLabel(data.totalItems) : ''}
        </p>

        <div className="mt-5 md:mt-8">
          {query.isPending ? (
            <div
              aria-busy="true"
              aria-label="Carregando NFTs"
              className="grid grid-cols-2 gap-x-4 gap-y-6 sm:gap-x-6 md:grid-cols-3 md:gap-y-8 xl:gap-x-8.5 xl:gap-y-12 max-md:[&>*:nth-child(even)]:mt-8"
            >
              {Array.from({ length: CATALOG_PAGE_SIZE }, (_, i) => (
                <NftCardSkeleton key={i} />
              ))}
            </div>
          ) : query.isError && !data ? (
            <QueryError
              title="Não foi possível carregar o catálogo"
              error={query.error}
              onRetry={() => void query.refetch()}
              isRetrying={query.isFetching}
            />
          ) : data && data.items.length === 0 ? (
            <div className="rounded-md bg-card px-6 py-12 text-center">
              <p className="text-lg font-bold">Nenhum NFT encontrado</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {search.page > data.totalPages
                  ? 'Esta página não existe mais.'
                  : 'Tente outros termos ou remova alguns filtros.'}
              </p>
              <Button asChild className="mt-5">
                {search.page > data.totalPages ? (
                  <Link
                    from="/"
                    to="/"
                    search={(prev) => ({ ...prev, page: undefined })}
                    resetScroll={false}
                  >
                    Ir para a primeira página
                  </Link>
                ) : (
                  <Link
                    from="/"
                    to="/"
                    search={(prev) => ({ sort: prev.sort })}
                    resetScroll={false}
                  >
                    Limpar filtros
                  </Link>
                )}
              </Button>
            </div>
          ) : data ? (
            <>
              <ul
                aria-label="Resultados do catálogo"
                aria-busy={query.isPlaceholderData}
                className={cn(
                  // Celular: grade desencontrada (coluna da direita mais baixa), como no Figma.
                  'grid grid-cols-2 gap-x-4 gap-y-6 transition-opacity sm:gap-x-6 md:grid-cols-3 md:gap-y-8 xl:gap-x-8.5 xl:gap-y-12 max-md:[&>*:nth-child(even)]:mt-8',
                  query.isPlaceholderData && 'opacity-60',
                )}
              >
                {data.items.map((nft, index) => (
                  <li key={nft.id}>
                    <NftCard nft={nft} priority={index < 3} />
                  </li>
                ))}
              </ul>
              <CatalogPagination page={data.page} totalPages={data.totalPages} />
            </>
          ) : null}
        </div>

        <SpotlightCard className="mt-12 lg:hidden" />
      </div>
      {filtersSheet}
    </section>
  )
}
