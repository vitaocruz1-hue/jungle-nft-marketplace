import type { EthAmount } from '@/contracts/common'

/**
 * Aritmética de ETH sem perda de precisão.
 *
 * 1 ETH = 10^18 wei. Convertemos a string decimal ("1.19") para um inteiro
 * em wei (BigInt), fazemos as contas com inteiros e voltamos para string.
 * Assim "0.1" + "0.2" dá exatamente "0.3".
 */

const DECIMALS = 18
const WEI_PER_ETH = 10n ** BigInt(DECIMALS)
const ETH_PATTERN = /^\d+(\.\d{1,18})?$/

export function isEthAmount(value: string): boolean {
  return ETH_PATTERN.test(value)
}

/** "1.19" → 1190000000000000000n */
export function parseEth(value: EthAmount): bigint {
  if (!isEthAmount(value)) throw new Error(`Valor em ETH inválido: "${value}"`)
  const [whole = '0', fraction = ''] = value.split('.')
  return BigInt(whole) * WEI_PER_ETH + BigInt(fraction.padEnd(DECIMALS, '0'))
}

/** 1190000000000000000n → "1.19" (mínimo de 2 casas, sem zeros sobrando). */
export function formatWei(wei: bigint, minDecimals = 2): EthAmount {
  const negative = wei < 0n
  const abs = negative ? -wei : wei
  const whole = abs / WEI_PER_ETH
  let fraction = (abs % WEI_PER_ETH).toString().padStart(DECIMALS, '0').replace(/0+$/, '')
  if (fraction.length < minDecimals) fraction = fraction.padEnd(minDecimals, '0')
  return `${negative ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`
}

/** Normaliza para o formato de exibição: "1.1" → "1.10", "2" → "2.00". */
export function normalizeEth(value: EthAmount): EthAmount {
  return formatWei(parseEth(value))
}

export function compareEth(a: EthAmount, b: EthAmount): -1 | 0 | 1 {
  const diff = parseEth(a) - parseEth(b)
  return diff === 0n ? 0 : diff > 0n ? 1 : -1
}

export function addEth(...values: EthAmount[]): EthAmount {
  return formatWei(values.reduce((sum, v) => sum + parseEth(v), 0n))
}

export function subtractEth(a: EthAmount, b: EthAmount): EthAmount {
  return formatWei(parseEth(a) - parseEth(b))
}

/** Preço × quantidade (quantidade sempre inteira). */
export function multiplyEth(value: EthAmount, quantity: number): EthAmount {
  if (!Number.isInteger(quantity)) throw new Error('Quantidade deve ser inteira')
  return formatWei(parseEth(value) * BigInt(quantity))
}

/** Percentual em pontos-base (1000 = 10%), arredondando para baixo. */
export function percentOfEth(value: EthAmount, basisPoints: number): EthAmount {
  return formatWei((parseEth(value) * BigInt(basisPoints)) / 10_000n)
}

/** Texto para a interface: "1.19 ETH". */
export function displayEth(value: EthAmount): string {
  return `${normalizeEth(value)} ETH`
}
