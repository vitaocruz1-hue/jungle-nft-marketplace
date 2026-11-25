import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import type { EthAmount } from '@/contracts/common'

import type { CatalogSearch } from '../search-params'

const brl = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Arredonda para 2 casas sem erro de ponto flutuante na exibição. */
const toCents = (value: number) => Math.round(value * 100) / 100

interface PriceRangeFilterProps {
  bounds: { min: EthAmount; max: EthAmount }
  search: CatalogSearch
}

export function PriceRangeFilter({ bounds, search }: PriceRangeFilterProps) {
  const navigate = useNavigate({ from: '/' })
  const min = Number(bounds.min)
  const max = Number(bounds.max)
  const applied: [number, number] = [search.minPrice ?? min, search.maxPrice ?? max]

  // O controle muda localmente; a URL (e a busca) só muda ao clicar em "Aplicar".
  const [draft, setDraft] = useState<[number, number]>(applied)
  const [lastApplied, setLastApplied] = useState(applied.join())
  if (lastApplied !== applied.join()) {
    // A URL mudou por fora (voltar, limpar filtros): sincroniza o controle.
    setLastApplied(applied.join())
    setDraft(applied)
  }

  function apply() {
    const [from, to] = draft
    void navigate({
      search: (prev) => ({
        ...prev,
        minPrice: from > min ? toCents(from) : undefined,
        maxPrice: to < max ? toCents(to) : undefined,
        page: undefined,
      }),
      resetScroll: false,
    })
  }

  return (
    <div>
      <Slider
        min={min}
        max={max}
        step={0.01}
        value={draft}
        minStepsBetweenThumbs={1}
        onValueChange={(value) => setDraft([value[0] ?? min, value[1] ?? max])}
        thumbLabels={['Preço mínimo', 'Preço máximo']}
        className="mt-2"
      />
      <p className="mt-4 text-sm sm:text-base" aria-live="polite">
        Preço: {brl.format(draft[0])} - {brl.format(draft[1])} ETH
      </p>
      <Button type="button" onClick={apply} className="mt-3 h-9 px-3 text-base font-bold">
        Aplicar
      </Button>
    </div>
  )
}
