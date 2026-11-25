import { useRouterState } from '@tanstack/react-router'

/**
 * No celular (< 768 px) o Figma usa um layout de aplicativo: cada tela decide
 * se mostra o cabeçalho do site, a barra de abas inferior e o rodapé.
 * No tablet e no desktop, tudo aparece sempre.
 */
export interface MobileChrome {
  header: boolean
  tabBar: boolean
  footer: boolean
}

const FOCUSED = /^\/(nft\/|carrinho|pagamento|login|cadastro)/

export function getMobileChrome(pathname: string): MobileChrome {
  if (pathname === '/') return { header: false, tabBar: true, footer: true }
  if (FOCUSED.test(pathname)) return { header: false, tabBar: false, footer: false }
  return { header: true, tabBar: true, footer: true }
}

export function useMobileChrome() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  return getMobileChrome(pathname)
}
