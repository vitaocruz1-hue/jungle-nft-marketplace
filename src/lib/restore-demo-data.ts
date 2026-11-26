/**
 * Volta a demonstração ao estado inicial: catálogo, contas, carrinhos, pedidos,
 * cenário de rede e sessão. Depois recarrega a página do zero.
 */
export function restoreDemoData() {
  for (const storage of [localStorage, sessionStorage]) {
    for (const key of Object.keys(storage)) {
      if (key.startsWith('kurio:')) storage.removeItem(key)
    }
  }
  // Com a API simulada ativa, grava o cenário inicial na hora (sem esperar o F5).
  window.__kurioMocks?.reset()
  // O cenário escolhido pela URL (?cenario=) também volta ao padrão.
  const url = new URL(window.location.href)
  url.searchParams.delete('cenario')
  window.location.replace(url)
}
