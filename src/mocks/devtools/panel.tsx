import { FlaskConicalIcon, XIcon } from 'lucide-react'
import { useState } from 'react'

import { mockControls } from '../controls'
import { getActiveScenario, SCENARIOS, type ScenarioId } from '../scenarios'

/**
 * Painel de cenários da demonstração (camada de mocks, fora do app).
 * Troca o cenário de rede, restaura os dados e dispara eventos de tempo real
 * — tudo passando pela API simulada e pelo Socket.IO.
 */

const button =
  'w-full cursor-pointer rounded-sm border border-[#5c4030] px-3 py-1.5 text-left text-xs hover:border-[#e89b55] focus-visible:outline-2 focus-visible:outline-[#e89b55]'

export function ScenarioPanel() {
  const [open, setOpen] = useState(false)
  const [nftId, setNftId] = useState('emerald-ape-042')
  const [price, setPrice] = useState('2.00')
  const [feedback, setFeedback] = useState('')
  const active = getActiveScenario()

  function changeScenario(id: ScenarioId) {
    mockControls.setScenario(id)
    // Remove ?cenario= da URL para não sobrescrever a escolha, e recarrega.
    const url = new URL(window.location.href)
    url.searchParams.delete('cenario')
    window.location.replace(url)
  }

  function run(label: string, action: () => unknown) {
    const result = action()
    setFeedback(result === false ? `${label}: nada a fazer.` : `${label}: feito.`)
  }

  return (
    <div className="fixed bottom-3 left-3 z-[60] font-sans text-[#f5f1eb]">
      {open ? (
        <section
          aria-labelledby="painel-cenarios-titulo"
          className="max-h-[80vh] w-72 overflow-y-auto rounded-md border glass p-3 shadow-2xl [--glass-tint:#140d0a]"
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
              onClick={() => run('Sessão expirada', mockControls.expireSession)}
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
            <label className="block text-xs">
              NFT (id)
              <input
                value={nftId}
                onChange={(e) => setNftId(e.target.value)}
                className="mt-1 w-full rounded-sm border border-[#5c4030] bg-[#241612] px-2 py-1 text-xs"
              />
            </label>
            <label className="block text-xs">
              Novo preço (ETH)
              <input
                value={price}
                inputMode="decimal"
                onChange={(e) => setPrice(e.target.value)}
                className="mt-1 w-full rounded-sm border border-[#5c4030] bg-[#241612] px-2 py-1 text-xs"
              />
            </label>
            <button
              type="button"
              className={button}
              onClick={() => run('Preço alterado', () => mockControls.changeNftPrice(nftId, price))}
            >
              Alterar preço (nft.updated)
            </button>
            <button
              type="button"
              className={button}
              onClick={() => run('Esgotado', () => mockControls.sellOut(nftId))}
            >
              Esgotar todas as edições
            </button>
            <button
              type="button"
              className={button}
              onClick={() => run('Evento duplicado', mockControls.replayLastEvent)}
            >
              Reenviar último evento (duplicata)
            </button>
            <button
              type="button"
              className={button}
              onClick={() => run('Evento antigo', () => mockControls.emitStaleNftEvent(nftId))}
            >
              Enviar versão antiga (deve ser ignorada)
            </button>
            <button
              type="button"
              className={button}
              onClick={() => run('Conexões derrubadas', mockControls.dropConnections)}
            >
              Derrubar conexão (reconecta sozinho)
            </button>
          </div>

          <p role="status" className="mt-3 min-h-4 text-xs text-[#e89b55]">
            {feedback}
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
