import { Link, useNavigate } from '@tanstack/react-router'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CATALOG_SORTS, type CatalogSort, type CatalogTab } from '@/contracts/catalog'
import { cn } from '@/lib/utils'

import type { CatalogSearch } from '../search-params'

const TABS: { value: CatalogTab; label: string }[] = [
  { value: 'all', label: 'Todos os NFTs' },
  { value: 'new', label: 'Novos lançamentos' },
  { value: 'trending', label: 'Em alta' },
]

const SORT_LABELS: Record<CatalogSort, string> = {
  recent: 'Listados recentemente',
  'price-asc': 'Menor preço',
  'price-desc': 'Maior preço',
  'name-asc': 'Nome (A–Z)',
}

function isCatalogSort(value: string): value is CatalogSort {
  return (CATALOG_SORTS as readonly string[]).includes(value)
}

export function CatalogToolbar({
  search,
  filtersButton,
}: {
  search: CatalogSearch
  filtersButton?: React.ReactNode
}) {
  const navigate = useNavigate({ from: '/' })

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <nav aria-label="Seções do catálogo">
        <ul className="flex flex-wrap gap-x-4 gap-y-2 sm:gap-x-6">
          {TABS.map((tab) => {
            const active = search.tab === tab.value
            return (
              <li key={tab.value}>
                <Link
                  from="/"
                  to="/"
                  search={(prev) => ({ ...prev, tab: tab.value, page: undefined })}
                  resetScroll={false}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative inline-block pb-1.5 text-sm transition-colors hover:text-highlight sm:text-base',
                    active &&
                      'text-highlight after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary',
                  )}
                >
                  {tab.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="flex min-w-0 items-center justify-between gap-3">
        {filtersButton}
        <div className="flex min-w-0 items-center gap-2">
          <span
            id="ordenar-rotulo"
            className="sr-only text-sm whitespace-nowrap sm:not-sr-only sm:text-base"
          >
            Ordenar por:
          </span>
          <Select
            value={search.sort}
            onValueChange={(value) => {
              if (!isCatalogSort(value)) return
              void navigate({
                search: (prev) => ({ ...prev, sort: value, page: undefined }),
                resetScroll: false,
              })
            }}
          >
            <SelectTrigger
              aria-labelledby="ordenar-rotulo"
              className="h-9 min-w-0 border-0 bg-transparent px-2 text-sm shadow-none hover:bg-secondary sm:text-base"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {CATALOG_SORTS.map((sort) => (
                <SelectItem key={sort} value={sort}>
                  {SORT_LABELS[sort]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
