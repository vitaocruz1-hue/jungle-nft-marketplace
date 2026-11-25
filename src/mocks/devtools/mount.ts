import { createElement } from 'react'
import { createRoot } from 'react-dom/client'

import { ScenarioPanel } from './panel'

/** Mostra o painel, exceto em navegadores automatizados (a não ser com ?painel=1). */
export function mountScenarioPanel() {
  const forced = new URLSearchParams(window.location.search).get('painel') === '1'
  if (navigator.webdriver && !forced) return
  const host = document.createElement('div')
  host.id = 'painel-cenarios'
  document.body.appendChild(host)
  createRoot(host).render(createElement(ScenarioPanel))
}
