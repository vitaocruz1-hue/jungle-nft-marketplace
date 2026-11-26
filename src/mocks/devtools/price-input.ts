import { isEthAmount, normalizeEth, parseEth } from '@/lib/eth'

export type PriceInputResult = { ok: true; value: string } | { ok: false; error: string }

/**
 * Lê o preço digitado no painel: só número, vírgula ou ponto, maior que zero e
 * até 18 casas decimais (a precisão do ETH). Devolve a string decimal com ponto
 * (ex.: "4,5" → "4.50"), que é como a API recebe valores em ETH.
 */
export function parsePriceInput(raw: string): PriceInputResult {
  const text = raw.trim().replace(',', '.')
  if (text === '') return { ok: false, error: 'Informe o novo preço.' }
  if (!/^\d+(\.\d+)?$/.test(text)) {
    return { ok: false, error: 'Use só números, com vírgula ou ponto (ex.: 4,00).' }
  }
  if (!isEthAmount(text)) return { ok: false, error: 'Use no máximo 18 casas decimais.' }
  if (parseEth(text) <= 0n) return { ok: false, error: 'O preço precisa ser maior que zero.' }
  return { ok: true, value: normalizeEth(text) }
}
