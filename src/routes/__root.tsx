import type { QueryClient } from '@tanstack/react-query'
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  useRouterState,
} from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

import { Container } from '@/components/layout/container'
import { useMobileChrome } from '@/components/layout/mobile-chrome'
import { MobileTabBar } from '@/components/layout/mobile-tab-bar'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { NotFound } from '@/components/not-found'
import { Toaster } from '@/components/ui/sonner'
import { useSessionExpiryHandler } from '@/features/auth/hooks'
import { useRealtimeSync } from '@/features/realtime/use-realtime-sync'
import { cn } from '@/lib/utils'

export interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({ meta: [{ title: 'Kurio · Marketplace de NFTs' }] }),
  component: RootLayout,
  notFoundComponent: () => (
    <Container>
      <NotFound />
    </Container>
  ),
})

/**
 * Fade curto do conteúdo ao trocar de página dentro do site. A 1ª carga não anima
 * (não atrasa o LCP). Só opacidade: um transform faria os elementos "fixed" da página
 * (ex.: barra de compra no celular) se moverem durante a animação.
 */
function usePageTransition() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const mainRef = useRef<HTMLElement>(null)
  const firstRender = useRef(true)

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    const main = mainRef.current
    if (!main) return
    main.classList.remove('page-enter')
    void main.offsetWidth // reinicia a animação
    main.classList.add('page-enter')
  }, [pathname])

  return mainRef
}

function RootLayout() {
  useSessionExpiryHandler()
  useRealtimeSync()
  const chrome = useMobileChrome()
  const mainRef = usePageTransition()

  return (
    <>
      <HeadContent />
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Pular para o conteúdo
      </a>
      <SiteHeader className={cn(!chrome.header && 'max-md:hidden')} />
      {/* Altura mínima de uma tela: o rodapé não aparece (e depois "pula") enquanto o conteúdo carrega. */}
      <main ref={mainRef} id="conteudo" tabIndex={-1} className="min-h-dvh outline-none">
        <Outlet />
      </main>
      <SiteFooter
        className={cn(!chrome.footer && 'max-md:hidden', chrome.tabBar && 'max-md:mb-24')}
      />
      {chrome.tabBar && <MobileTabBar />}
      {/* No celular, acima da barra de abas e das barras de ação fixas. */}
      <Toaster position="bottom-right" mobileOffset={{ bottom: 120 }} />
    </>
  )
}
