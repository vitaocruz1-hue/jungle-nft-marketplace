import { FlaskConicalIcon, XIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

import { mockControls } from '../controls'
import { getActiveScenario, SCENARIOS, type ScenarioId } from '../scenarios'
import { parsePriceInput } from './price-input'
import { useBottomBarOffset } from './use-bottom-bar-offset'

/**
 * Painel de cenários da demonstração (camada de mocks, fora do app).
 * Troca o cenário de rede, restaura os dados e dispara eventos de tempo real
 * — tudo passando pela API simulada e pelo Socket.IO.
 */

const button =
  'w-full cursor-pointer rounded-sm border border-[#5c4030] px-3 py-1.5 text-left text-xs hover:border-[#e89b55] focus-visible:outline-2 focus-visible:outline-[#e89b55] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[#5c4030]'

const field =
  'mt-1 w-full rounded-sm border border-[#5c4030] bg-[#241612] px-2 py-1 text-xs focus-visible:outline-2 focus-visible:outline-[#e89b55]'

/** Espaço do botão "Cenários" (altura + margem) reservado no fim da página no celular. */
const FAB_SPACE_PX = 56

interface Feedback {
  ok: boolean
  text: string
}

export function ScenarioPanel() {
  const [open, setOpen] = useState(false)
  const [nftId, setNftId] = useState('emerald-ape-042')
  const [price, setPrice] = useState('2.00')
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  // Relê a lista depois de cada ação (preço atual e "esgotado" mudam).
  const [, setRevision] = useState(0)
  const active = getActiveScenario()
  const nfts = mockControls.listNfts()
  const selected = nfts.find((nft) => nft.id === nftId)
  const priceCheck = parsePriceInput(price)
  // No celular, fica acima da barra de abas (ou da barra de compra), sem cobrir nenhum ícone.
  const barOffset = useBottomBarOffset()
  const hasBottomBar = barOffset > 0

  // Com o botão acima da barra, o fim da página ganha espaço para nenhum conteúdo ficar por baixo dele.
  useEffect(() => {
    if (!hasBottomBar) return
    const previous = document.body.style.paddingBottom
    document.body.style.paddingBottom = `${FAB_SPACE_PX}px`
    return () => {
      document.body.style.paddingBottom = previous
    }
  }, [hasBottomBar])

  function changeScenario(id: ScenarioId) {
    mockControls.setScenario(id)
    // Remove ?cenario= da URL para não sobrescrever a escolha, e recarrega.
    const url = new URL(window.location.href)
    url.searchParams.delete('cenario')
    window.location.replace(url)
  }

  function report(ok: boolean, success: string, failure: string) {
    setFeedback(ok ? { ok, text: success } : { ok, text: failure })
    setRevision((n) => n + 1)
  }

  function changePrice() {
    if (!selected || !priceCheck.ok) return
    report(
      mockControls.changeNftPrice(selected.id, priceCheck.value),
      `Preço do ${selected.name} alterado para ${priceCheck.value} ETH.`,
      `Não foi possível alterar o preço do ${selected.name}.`,
    )
  }

  return (
    <div
      className="fixed left-3 z-[60] font-sans text-[#f5f1eb]"
      style={{
        // Sem barra no rodapé (desktop e telas sem barra): 12 px acima da safe-area.
        bottom: hasBottomBar ? `${barOffset + 12}px` : 'calc(env(safe-area-inset-bottom) + 12px)',
      }}
    >
      {open ? (
        <section
          aria-labelledby="painel-cenarios-titulo"
          style={{ maxHeight: `min(80vh, calc(100dvh - ${barOffset + 24}px))` }}
          className="w-72 overflow-y-auto rounded-md border glass p-3 shadow-2xl [--glass-tint:#140d0a]"
        >
          <div className="flex items-center justify-between">
            <h2 id="painel-cenarios-titulo" className="text-sm font-bold">
              Cenários da simulação
            </h2>
            <button
              type="button"
              aria-label="Fechar painel de cenários"
              onClick={() => setOpen(false)}
              className="cursor-pointer rounded-sm p-1 hover:bg-[#38220f]"
            >
              <XIcon aria-hidden="true" className="size-4" />
            </button>
          </div>

          <fieldset className="mt-3">
            <legend className="text-xs font-bold text-[#cfb28c]">Rede e API</legend>
            <div className="mt-2 space-y-1">
              {(Object.keys(SCENARIOS) as ScenarioId[]).map((id) => (
                <label key={id} className="flex cursor-pointer items-start gap-2 text-xs">
                  <input
                    type="radio"
                    name="cenario"
                    checked={id === active}
                    onChange={() => changeScenario(id)}
                    className="mt-0.5 accent-[#d28a4c]"
                  />
                  <span>
                    <strong>{id}</strong> — {SCENARIOS[id]}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-4 space-y-1.5">
            <p className="text-xs font-bold text-[#cfb28c]">Sessão e dados</p>
            <button
              type="button"
              className={button}
              onClick={() => {
                mockControls.expireSession()
                report(true, 'Sessão expirada: a próxima ação pede login de novo.', '')
              }}
            >
              Expirar sessão atual
            </button>
            <button
              type="button"
              className={button}
              onClick={() => {
                mockControls.reset()
                localStorage.removeItem('kurio:session-token')
                localStorage.removeItem('kurio:guest-cart-id')
                sessionStorage.clear()
                window.location.assign('/')
              }}
            >
              Restaurar dados iniciais (reset)
            </button>
          </div>

          <div className="mt-4 space-y-1.5">
            <p className="text-xs font-bold text-[#cfb28c]">Tempo real (Socket.IO)</p>
            <label htmlFor="painel-nft" className="block text-xs">
              NFT
            </label>
            <select
              id="painel-nft"
              value={nftId}
              onChange={(e) => setNftId(e.target.value)}
              aria-describedby="painel-nft-preco"
              className={field}
            >
              {nfts.map((nft) => (
                <option key={nft.id} value={nft.id}>
                  {nft.soldOut ? `${nft.name} (esgotado)` : nft.name}
                </option>
              ))}
            </select>
            <p id="painel-nft-preco" className="text-xs text-[#cfb28c]">
              {selected ? `Preço atual: ${selected.price} ETH` : 'Escolha um NFT.'}
            </p>

            <label htmlFor="painel-preco" className="block pt-1 text-xs">
              Novo preço
            </label>
            <div
              className={cn(
                'flex items-center rounded-sm border bg-[#241612] focus-within:border-[#e89b55]',
                priceCheck.ok ? 'border-[#5c4030]' : 'border-[#ff8a7a]',
              )}
            >
              <input
                id="painel-preco"
                value={price}
                inputMode="decimal"
                autoComplete="off"
                aria-invalid={!priceCheck.ok}
                aria-describedby="painel-preco-ajuda"
                onChange={(e) => setPrice(e.target.value)}
                className="w-full min-w-0 bg-transparent px-2 py-1 text-xs outline-none"
              />
              <span className="pr-2 text-xs text-[#cfb28c]">ETH</span>
            </div>
            <p
              id="painel-preco-ajuda"
              className={cn('text-xs', priceCheck.ok ? 'text-[#cfb28c]' : 'text-[#ff8a7a]')}
            >
              {priceCheck.ok ? 'Vírgula ou ponto; até 18 casas decimais.' : priceCheck.error}
            </p>
            <button
              type="button"
              className={button}
              disabled={!selected || !priceCheck.ok}
              onClick={changePrice}
            >
              Alterar preço (nft.updated)
            </button>
            <button
              type="button"
              className={button}
              disabled={!selected}
              onClick={() =>
                selected &&
                report(
                  mockControls.sellOut(selected.id),
                  `${selected.name}: todas as edições esgotadas.`,
                  `Não foi possível esgotar o ${selected.name}.`,
                )
              }
            >
              Esgotar todas as edições
            </button>
            <button
              type="button"
              className={button}
              onClick={() =>
                report(
                  mockControls.replayLastEvent(),
                  'Último evento reenviado: o app deve ignorar a duplicata.',
                  'Ainda não há evento para reenviar.',
                )
              }
            >
              Reenviar último evento (duplicata)
            </button>
            <button
              type="button"
              className={button}
              disabled={!selected}
              onClick={() =>
                selected &&
                report(
                  mockControls.emitStaleNftEvent(selected.id),
                  `Versão antiga do ${selected.name} enviada: o app deve ignorar.`,
                  `Não foi possível enviar a versão antiga do ${selected.name}.`,
                )
              }
            >
              Enviar versão antiga (deve ser ignorada)
            </button>
            <button
              type="button"
              className={button}
              onClick={() => {
                mockControls.dropConnections()
                report(true, 'Conexões derrubadas: o app reconecta sozinho.', '')
              }}
            >
              Derrubar conexão (reconecta sozinho)
            </button>
          </div>

          <p
            role="status"
            className={cn(
              'mt-3 min-h-4 text-xs',
              feedback?.ok === false ? 'text-[#ff8a7a]' : 'text-[#e89b55]',
            )}
          >
            {feedback?.text}
          </p>
        </section>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Abrir painel de cenários (cenário atual: ${active})`}
          className="flex cursor-pointer items-center gap-1.5 rounded-full border border-[#5c4030] bg-[#140d0a]/95 px-3 py-2 text-xs shadow-lg hover:border-[#e89b55] focus-visible:outline-2 focus-visible:outline-[#e89b55]"
        >
          <FlaskConicalIcon aria-hidden="true" className="size-4 text-[#e89b55]" />
          Cenários{active !== 'padrao' && `: ${active}`}
        </button>
      )}
    </div>
  )
}
