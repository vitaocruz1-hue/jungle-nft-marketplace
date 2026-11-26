import { Link, useRouterState } from '@tanstack/react-router'
import { MenuIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

import { notifyComingSoon } from '@/lib/coming-soon'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

import { Container } from './container'
import { AccountButton, CartLink } from './header-actions'
import { SearchDialog } from './search-dialog'

const navItemClass =
  'relative flex h-full items-center text-base transition-colors hover:text-highlight'
const activeNavItemClass =
  'font-bold text-highlight after:absolute after:inset-x-0 after:bottom-[-1px] after:h-[3px] after:bg-primary'

function useActiveSection() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  // No Figma, "Mercado" fica ativo no detalhe, no carrinho e no pagamento.
  const isMarket = ['/nft', '/carrinho', '/pagamento'].some((path) => pathname.startsWith(path))
  return { isHome: pathname === '/', isMarket }
}

function MainNav({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const { isHome, isMarket } = useActiveSection()

  return (
    <ul className={className}>
      <li className="h-full">
        <Link
          to="/"
          onClick={onNavigate}
          aria-current={isHome ? 'page' : undefined}
          className={cn(navItemClass, isHome && activeNavItemClass)}
        >
          Início
        </Link>
      </li>
      <li className="h-full">
        <Link
          to="/"
          hash="catalogo"
          onClick={onNavigate}
          aria-current={isMarket ? 'page' : undefined}
          className={cn(navItemClass, isMarket && activeNavItemClass)}
        >
          Mercado
        </Link>
      </li>
      {(['Criadores', 'Aprenda'] as const).map((section) => (
        <li key={section} className="h-full">
          <button
            type="button"
            className={cn(navItemClass, 'cursor-pointer')}
            onClick={() => {
              onNavigate?.()
              notifyComingSoon(section)
            }}
          >
            {section}
          </button>
        </li>
      ))}
    </ul>
  )
}

/** A página saiu do topo? (o cabeçalho fixo vira vidro). */
function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > threshold)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [threshold])
  return scrolled
}

export function SiteHeader({ className }: { className?: string }) {
  const scrolled = useScrolled()
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  return (
    <header
      className={cn(
        // A partir de 768 px fica preso no topo. No topo: igual ao Figma. Ao rolar: vidro.
        // A linha clara do vidro é uma sombra de 1 px: não muda a altura do cabeçalho.
        'z-40 transition-[background-color,box-shadow] duration-200 md:sticky md:top-0',
        scrolled &&
          'md:glass md:shadow-[0_1px_0_rgb(255_255_255/0.09)] md:[--glass-tint:var(--background)]',
        className,
      )}
    >
      <Container>
        <div
          className={cn(
            'flex h-[69px] items-center justify-between gap-4 border-b border-[#8b5b33]/70 transition-colors duration-200',
            scrolled && 'md:border-transparent',
          )}
        >
          <Link
            to="/"
            className="text-base font-bold tracking-wide lg:mt-[14px] lg:text-sm lg:tracking-wider"
            aria-label="Kurio, página inicial"
          >
            KURIO
          </Link>

          <nav aria-label="Principal" className="hidden h-full md:block lg:ml-auto">
            <MainNav className="flex h-full items-center gap-8 lg:gap-[41px]" />
          </nav>

          <div className="flex items-center gap-1 sm:gap-3 lg:mt-[14px] lg:ml-[196px]">
            <SearchDialog />

            <CartLink />
            <AccountButton className="ml-1 hidden sm:inline-flex lg:ml-[17px]" />

            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu">
                  <MenuIcon className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                  <SheetDescription className="sr-only">Navegação principal</SheetDescription>
                </SheetHeader>
                <nav aria-label="Principal (celular)" className="px-4">
                  <MenuSheetLinks onNavigate={closeMenu} />
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </Container>
    </header>
  )
}

function MenuSheetLinks({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <MainNav
        onNavigate={onNavigate}
        className="flex flex-col gap-5 [&_a]:h-auto [&_button]:h-auto"
      />
      <div className="sm:hidden" onClickCapture={onNavigate}>
        <AccountButton className="h-10 w-full justify-start" />
      </div>
    </div>
  )
}
