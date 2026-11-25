import { Link, useRouterState } from '@tanstack/react-router'
import { MenuIcon } from 'lucide-react'
import { useState } from 'react'

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
  'relative flex h-full items-center px-1 text-base transition-colors hover:text-highlight'
const activeNavItemClass =
  'font-bold text-highlight after:absolute after:inset-x-0 after:bottom-[-1px] after:h-[3px] after:bg-primary'

function useActiveSection() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  return { isHome: pathname === '/', isMarket: pathname.startsWith('/nft') }
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

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  return (
    <header>
      <Container>
        <div className="flex h-[68px] items-center justify-between gap-4 border-b border-[#8b5b33]/70">
          <Link
            to="/"
            className="text-base font-bold tracking-wide"
            aria-label="Kurio, página inicial"
          >
            KURIO
          </Link>

          <nav aria-label="Principal" className="hidden h-full md:block">
            <MainNav className="flex h-full items-center gap-8 lg:gap-14" />
          </nav>

          <div className="flex items-center gap-1 sm:gap-3">
            <SearchDialog />

            <CartLink />
            <AccountButton className="ml-1 hidden sm:inline-flex" />

            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu">
                  <MenuIcon className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 bg-background">
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
