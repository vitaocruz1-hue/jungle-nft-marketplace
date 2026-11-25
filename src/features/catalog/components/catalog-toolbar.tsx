import { Link } from '@tanstack/react-router'

import type { CatalogTab } from '@/contracts/catalog'
import { cn } from '@/lib/utils'

import type { CatalogSearch } from '../search-params'
import { CatalogSort } from './catalog-sort'

const TABS: { value: CatalogTab; label: string }[] = [
  { value: 'all', label: 'Todos os NFTs' },
  { value: 'new', label: 'Novos lançamentos' },
  { value: 'trending', label: 'Em alta' },
]

export function CatalogToolbar({
  search,
  filtersButton,
}: {
  search: CatalogSearch
  filtersButton?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <nav aria-label="Seções do catálogo">
        <ul className="flex flex-wrap gap-x-3 gap-y-2 sm:gap-x-6">
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

      {/* No celular, filtros e ordenação ficam na gaveta (aberta pelo botão ao lado da busca). */}
      <div className="flex min-w-0 items-center justify-between gap-3 max-md:hidden">
        {filtersButton}
        <CatalogSort id="ordenar" value={search.sort} />
      </div>
    </div>
  )
}
