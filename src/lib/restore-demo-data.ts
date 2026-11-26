/**
 * Volta a demonstração ao estado inicial: catálogo, contas, carrinhos, pedidos,
 * cenário de rede e sessão. Depois recarrega a página do zero.
 */
export function restoreDemoData() {
  // 1º tira o ?cenario= da URL atual: uma chamada ainda em andamento que leia a
  // URL não grava o cenário antigo de volta depois da limpeza.
  const url = new URL(window.location.href)
  url.searchParams.delete('cenario')
  window.history.replaceState(window.history.state, '', url)

  for (const storage of [localStorage, sessionStorage]) {
    for (const key of Object.keys(storage)) {
      if (key.startsWith('kurio:')) storage.removeItem(key)
    }
  }
  // Com a API simulada ativa, grava o cenário inicial na hora (sem esperar o F5).
  window.__kurioMocks?.reset()
  window.location.reload()
}
