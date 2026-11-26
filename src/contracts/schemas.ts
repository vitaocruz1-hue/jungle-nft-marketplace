import { z } from 'zod'

import type { AuthResponse, SessionResponse, User } from './auth'
import type { AppliedCoupon, Cart, CartItem } from './cart'
import {
  CATEGORY_IDS,
  NETWORK_IDS,
  RARITIES,
  type FeaturedNft,
  type FeaturedResponse,
  type NftDetail,
  type NftEdition,
  type NftImage,
  type NftListResponse,
  type NftReview,
  type NftSummary,
} from './catalog'

/**
 * Esquemas (zod) das respostas das rotas principais: catálogo, detalhe,
 * carrinho e sessão. O app confere cada resposta antes de usar: dado em
 * formato inesperado vira erro tratado na tela, nunca um crash.
 * O `satisfies` faz o TypeScript avisar se o esquema e o contrato divergirem.
 */

/** Valor em ETH como string decimal (ex.: "1.19"). */
const ethAmount = z.string().regex(/^-?\d+(\.\d+)?$/)

const nftImage = z.object({
  src: z.string(),
  alt: z.string(),
  width: z.number(),
  height: z.number(),
}) satisfies z.ZodType<NftImage>

const nftSummaryShape = z.object({
  id: z.string(),
  name: z.string(),
  image: nftImage,
  price: ethAmount,
  compareAtPrice: ethAmount.nullable(),
  category: z.enum(CATEGORY_IDS),
  network: z.enum(NETWORK_IDS),
  soldOut: z.boolean(),
  rarity: z.enum(RARITIES),
  version: z.number(),
})
export const nftSummarySchema = nftSummaryShape satisfies z.ZodType<NftSummary>

const nftEdition = z.object({
  id: z.string(),
  label: z.string(),
  supply: z.number().nullable(),
  available: z.number(),
  price: ethAmount,
  maxPerOrder: z.number(),
}) satisfies z.ZodType<NftEdition>

const nftReview = z.object({
  id: z.string(),
  author: z.string(),
  rating: z.number(),
  comment: z.string(),
  createdAt: z.string(),
}) satisfies z.ZodType<NftReview>

export const nftDetailSchema = nftSummaryShape.extend({
  tokenId: z.string(),
  collection: z.object({ id: z.string(), name: z.string() }),
  creator: z.string(),
  description: z.string(),
  story: z.array(z.string()),
  attributes: z.array(z.string()),
  rating: z.number(),
  reviewCount: z.number(),
  royaltyPercent: z.number(),
  contractAddress: z.string(),
  gallery: z.array(nftImage),
  editions: z.array(nftEdition),
  reviews: z.array(nftReview),
}) satisfies z.ZodType<NftDetail>

const facet = <T extends readonly [string, ...string[]]>(values: T) =>
  z.object({ value: z.enum(values), label: z.string(), count: z.number() })

export const nftListResponseSchema = z.object({
  items: z.array(nftSummarySchema),
  page: z.number(),
  pageSize: z.number(),
  totalItems: z.number(),
  totalPages: z.number(),
  facets: z.object({
    categories: z.array(facet(CATEGORY_IDS)),
    networks: z.array(facet(NETWORK_IDS)),
    priceRange: z.object({ min: ethAmount, max: ethAmount }),
  }),
}) satisfies z.ZodType<NftListResponse>

export const relatedNftsSchema = z.array(nftSummarySchema) satisfies z.ZodType<NftSummary[]>

const featuredNft = z.object({
  nft: nftSummarySchema,
  image: nftImage,
}) satisfies z.ZodType<FeaturedNft>

export const featuredResponseSchema = z.object({
  hero: z.array(featuredNft),
  spotlight: featuredNft,
}) satisfies z.ZodType<FeaturedResponse>

const cartItem = z.object({
  id: z.string(),
  nftId: z.string(),
  editionId: z.string(),
  editionLabel: z.string(),
  name: z.string(),
  tokenId: z.string(),
  image: nftImage,
  unitPrice: ethAmount,
  addedUnitPrice: ethAmount,
  quantity: z.number(),
  available: z.number(),
  maxPerOrder: z.number(),
  lineTotal: ethAmount,
  issues: z.array(z.enum(['PRICE_CHANGED', 'OUT_OF_STOCK', 'QUANTITY_UNAVAILABLE'])),
}) satisfies z.ZodType<CartItem>

const appliedCoupon = z.object({
  code: z.string(),
  description: z.string(),
  basisPoints: z.number(),
}) satisfies z.ZodType<AppliedCoupon>

export const cartSchema = z.object({
  id: z.string(),
  items: z.array(cartItem),
  itemCount: z.number(),
  coupon: appliedCoupon.nullable(),
  subtotal: ethAmount,
  discount: ethAmount,
  networkFee: ethAmount,
  total: ethAmount,
  updatedAt: z.string(),
}) satisfies z.ZodType<Cart>

const user = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  displayName: z.string(),
  bio: z.string(),
  avatarUrl: z.string().nullable(),
  ensName: z.string(),
  walletNickname: z.string(),
}) satisfies z.ZodType<User>

export const sessionResponseSchema = z.object({
  user,
  expiresAt: z.string(),
}) satisfies z.ZodType<SessionResponse>

export const authResponseSchema = z.object({
  token: z.string(),
  user,
  expiresAt: z.string(),
}) satisfies z.ZodType<AuthResponse>
