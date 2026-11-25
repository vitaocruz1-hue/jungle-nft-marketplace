import type { NetworkId } from '@/contracts/catalog'
import type { AppliedCoupon } from '@/contracts/cart'
import { addEth, compareEth, formatWei, parseEth, percentOfEth } from '@/lib/eth'

/** Taxa de rede simulada por pedido (o Figma mostra 0.016 ETH na Ethereum). */
export const NETWORK_FEES: Record<NetworkId, string> = {
  ethereum: '0.016',
  polygon: '0.002',
  solana: '0.0008',
}

interface CouponDefinition extends AppliedCoupon {
  expiresAt: string
}

/** Cupons de demonstração (documentados no README). */
const COUPONS: CouponDefinition[] = [
  {
    code: 'KURIO10',
    description: 'Desconto do lançamento (10%)',
    basisPoints: 1000,
    expiresAt: '2099-12-31T23:59:59.000Z',
  },
  {
    code: 'GENESIS5',
    description: 'Coleção Gênesis (5%)',
    basisPoints: 500,
    expiresAt: '2099-12-31T23:59:59.000Z',
  },
  {
    code: 'EXPIRADO',
    description: 'Cupom de teste vencido',
    basisPoints: 2000,
    expiresAt: '2025-01-01T00:00:00.000Z',
  },
]

export type CouponCheck =
  | { ok: true; coupon: AppliedCoupon }
  | { ok: false; code: 'COUPON_INVALID' | 'COUPON_EXPIRED'; message: string }

export function checkCoupon(rawCode: string): CouponCheck {
  const code = rawCode.trim().toUpperCase()
  const found = COUPONS.find((c) => c.code === code)
  if (!found) return { ok: false, code: 'COUPON_INVALID', message: 'Cupom inválido.' }
  if (new Date(found.expiresAt).getTime() < Date.now()) {
    return { ok: false, code: 'COUPON_EXPIRED', message: 'Este cupom expirou.' }
  }
  const { expiresAt: _expiresAt, ...coupon } = found
  return { ok: true, coupon }
}

/** Subtotal − desconto + taxa de rede = total (tudo em BigInt, sem arredondar errado). */
export function computeTotals(subtotal: string, coupon: AppliedCoupon | null, network: NetworkId) {
  const hasItems = compareEth(subtotal, '0') > 0
  const discount = coupon && hasItems ? percentOfEth(subtotal, coupon.basisPoints) : '0.00'
  const networkFee = hasItems ? formatWei(parseEth(NETWORK_FEES[network])) : '0.00'
  const total = addEth(formatWei(parseEth(subtotal) - parseEth(discount)), networkFee)
  return { discount, networkFee, total }
}
