import { useNavigate, useSearch } from '@tanstack/react-router'
import { SearchIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * Busca do cabeçalho. Envia o termo para o catálogo da Início (?search=…),
 * mantendo os filtros já escolhidos e voltando para a página 1.
 */
export function SearchDialog() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const current = useSearch({ strict: false })

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const term = String(new FormData(event.currentTarget).get('search') ?? '').trim()
    setOpen(false)
    void navigate({
      to: '/',
      search: (prev) => ({ ...prev, search: term || undefined, page: undefined }),
      hash: 'catalogo',
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Buscar NFTs" className="hover:bg-secondary">
          <SearchIcon className="size-5 lg:size-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="top-24 translate-y-0 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Buscar NFTs</DialogTitle>
          <DialogDescription>Procure por nome, coleção ou criador.</DialogDescription>
        </DialogHeader>
        <form role="search" onSubmit={handleSubmit} className="flex gap-2">
          <Label htmlFor="busca-nfts" className="sr-only">
            Termo de busca
          </Label>
          <Input
            id="busca-nfts"
            name="search"
            type="search"
            autoComplete="off"
            placeholder="Ex.: Emerald Ape"
            defaultValue={typeof current.search === 'string' ? current.search : ''}
            className="h-10"
          />
          <Button type="submit" className="h-10">
            Buscar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
