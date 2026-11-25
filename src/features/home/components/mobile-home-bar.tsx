import { useNavigate, useSearch } from '@tanstack/react-router'
import { SearchIcon, SlidersHorizontalIcon } from 'lucide-react'

import { setFiltersSheetOpen } from '@/features/catalog/filters-sheet-store'

/** Topo da Início no celular (Figma): busca "Explorar coleções" + botão de filtros. */
export function MobileHomeBar() {
  const navigate = useNavigate({ from: '/' })
  const { search } = useSearch({ from: '/' })

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const term = String(new FormData(event.currentTarget).get('search') ?? '').trim()
    void navigate({
      search: (prev) => ({ ...prev, search: term || undefined, page: undefined }),
      hash: 'catalogo',
    })
  }

  return (
    <div className="flex gap-2.5 pt-6 md:hidden">
      <form role="search" onSubmit={handleSubmit} className="relative flex-1">
        <label htmlFor="busca-mobile" className="sr-only">
          Explorar coleções
        </label>
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground"
        />
        <input
          key={search ?? ''}
          id="busca-mobile"
          name="search"
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          placeholder="Explorar coleções"
          defaultValue={search ?? ''}
          className="h-11 w-full rounded-xl bg-card pr-3 pl-11 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />
      </form>
      <button
        type="button"
        aria-label="Filtros"
        onClick={() => setFiltersSheetOpen(true)}
        className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl bg-[linear-gradient(135deg,#d28a4c,#8f5e35)] text-primary-foreground"
      >
        <SlidersHorizontalIcon aria-hidden="true" className="size-5" />
      </button>
    </div>
  )
}
