import { useEffect, useState } from 'react'

/** Barras fixas do app no rodapé da tela (barra de abas e barra de compra do celular). */
const BOTTOM_BARS = '[data-bottom-bar], [data-bottom-bar] *'

/**
 * Distância entre o rodapé da tela e o ponto mais alto das barras fixas,
 * incluindo o que sobe acima delas (ex.: o botão central de busca). Já inclui a
 * safe-area do iPhone, que fica dentro das barras. No desktop as barras ficam
 * ocultas e o valor é 0.
 */
function measure() {
  let top = window.innerHeight
  for (const element of document.querySelectorAll<HTMLElement>(BOTTOM_BARS)) {
    const rect = element.getBoundingClientRect()
    if (rect.height > 0) top = Math.min(top, rect.top)
  }
  return Math.max(0, Math.round(window.innerHeight - top))
}

/** Acompanha a altura das barras: muda ao trocar de rota, abrir/fechar barras ou redimensionar. */
export function useBottomBarOffset() {
  // Medida já na 1ª renderização: o botão não "pula" de lugar ao aparecer.
  const [offset, setOffset] = useState(measure)

  useEffect(() => {
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => setOffset(measure()))
    }
    const observer = new MutationObserver(update)
    observer.observe(document.body, { childList: true, subtree: true })
    window.addEventListener('resize', update)
    update()
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  return offset
}
