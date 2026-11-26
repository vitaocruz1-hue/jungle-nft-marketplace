import { Link } from '@tanstack/react-router'

import { Skeleton } from '@/components/ui/skeleton'
import type { CategoryId, FacetOption, NetworkId, NftListResponse } from '@/contracts/catalog'
import { cn } from '@/lib/utils'

import { hasActiveFilters, type CatalogSearch } from '../search-params'
import { PriceRangeFilter } from './price-range-filter'

type Facets = NftListResponse['facets']

interface FacetListProps<T extends string> {
  title: string
  param: 'category' | 'network'
  options: FacetOption<T>[]
  selected: T | undefined
}

function FacetList<T extends CategoryId | NetworkId>({
  title,
  param,
  options,
  selected,
}: FacetListProps<T>) {
  const headingId = `filtro-${param}`
  return (
    <section aria-labelledby={headingId}>
      <h3 id={headingId} className="text-lg font-bold">
        {title}
      </h3>
      <ul className="mt-3 lg:mt-1.5">
        {options.map((option) => {
          const active = option.value === selected
          return (
            <li key={option.value}>
              <Link
                from="/"
                to="/"
                search={(prev) => ({
                  ...prev,
                  [param]: active ? undefined : option.value,
                  page: undefined,
                })}
                resetScroll={false}
                aria-current={active ? 'true' : undefined}
                className={cn(
                  'flex items-center justify-between rounded-sm py-2.5 pl-3 text-[15px] transition-colors hover:text-highlight lg:pr-3 lg:leading-5',
                  active ? 'font-semibold text-highlight' : 'text-muted-foreground',
                )}
              >
                <span>
                  {option.label}
                  {active && <span className="sr-only"> (filtro ativo, clique para remover)</span>}
                </span>
                <span className="font-bold tabular-nums">
                  <span className="sr-only">, </span>({option.count})
                  <span className="sr-only"> NFTs</span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function FacetListSkeleton({ title, rows }: { title: string; rows: number }) {
  return (
    <section>
      <h3 className="text-lg font-bold">{title}</h3>
      <div className="mt-3 space-y-4 pl-3">
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} className="h-5" />
        ))}
      </div>
    </section>
  )
}

interface CatalogFiltersProps {
  facets: Facets | undefined
  search: CatalogSearch
  /**
   * As opções de filtro vêm na mesma resposta do catálogo. Se ela falhou (e não
   * está sendo repetida), não há o que carregar: mostra um aviso em vez do skeleton.
   */
  unavailable?: boolean
  className?: string
}

/** Painel de filtros (coluna lateral no desktop, gaveta no celular). */
export function CatalogFilters({
  facets,
  search,
  unavailable = false,
  className,
}: CatalogFiltersProps) {
  if (!facets && unavailable) {
    return (
      <div className={cn('bg-card px-5 py-6', className)}>
        <p role="status" className="text-sm text-muted-foreground">
          Filtros indisponíveis no momento. Eles voltam junto com o catálogo.
        </p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-8 bg-card px-5 py-6 lg:pt-3.5', className)}>
      {hasActiveFilters(search) && (
        <Link
          from="/"
          to="/"
          search={(prev) => ({ sort: prev.sort })}
          resetScroll={false}
          className="text-sm text-highlight underline underline-offset-4"
        >
          Limpar filtros
        </Link>
      )}

      {facets ? (
        <FacetList
          title="Coleções"
          param="category"
          options={facets.categories}
          selected={search.category}
        />
      ) : (
        <FacetListSkeleton title="Coleções" rows={9} />
      )}

      <section aria-labelledby="filtro-preco">
        <h3 id="filtro-preco" className="text-lg font-bold">
          Faixa de preço
        </h3>
        {facets ? (
          <PriceRangeFilter bounds={facets.priceRange} search={search} />
        ) : (
          <Skeleton className="mt-3 h-24" />
        )}
      </section>

      {facets ? (
        <FacetList
          title="Rede"
          param="network"
          options={facets.networks}
          selected={search.network}
        />
      ) : (
        <FacetListSkeleton title="Rede" rows={3} />
      )}
    </div>
  )
}
