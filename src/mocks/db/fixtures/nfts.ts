import type { CategoryId, NetworkId, NftDetail, NftEdition, NftImage } from '@/contracts/catalog'
import { CATEGORY_IDS, NETWORK_IDS } from '@/contracts/catalog'
import { formatWei, multiplyEth, parseEth } from '@/lib/eth'

/** NFT como fica guardado no "banco" simulado (detalhe + campos internos). */
export interface NftRecord extends NftDetail {
  listedAt: string
  isNew: boolean
  isTrending: boolean
}

type Character = 'emerald' | 'sage' | 'neon' | 'golden'

const ART: Record<Character, NftImage> = {
  emerald: {
    src: '/images/nfts/emerald-ape.webp',
    alt: 'Macaco de pelo marrom com óculos redondos de lentes verdes e jaqueta college verde',
    width: 512,
    height: 512,
  },
  sage: {
    src: '/images/nfts/sage-nomad.webp',
    alt: 'Gorila de pelo cinza com chapéu bucket verde-oliva e moletom roxo',
    width: 496,
    height: 496,
  },
  neon: {
    src: '/images/nfts/neon-vessel.webp',
    alt: 'Macaco de pelo preto com blusa de gola alta verde e blazer bege',
    width: 496,
    height: 496,
  },
  golden: {
    src: '/images/nfts/golden-beat.webp',
    alt: 'Macaco de pelo dourado com fones de ouvido verdes e jaqueta clara',
    width: 496,
    height: 496,
  },
}

/** Versões maiores das artes, usadas nos destaques e no detalhe. */
export const LARGE_ART = {
  emerald: { ...ART.emerald, src: '/images/nfts/emerald-ape-lg.webp', width: 896, height: 896 },
  sagePortrait: {
    ...ART.sage,
    src: '/images/nfts/sage-nomad-portrait.webp',
    width: 616,
    height: 728,
  },
} satisfies Record<string, NftImage>

const COLLECTIONS: Record<Character, { id: string; name: string; creator: string }> = {
  emerald: { id: 'kurio-apes', name: 'Kurio Apes', creator: 'Nova Sato' },
  sage: { id: 'nomad-club', name: 'Nomad Club', creator: 'Iris Vale' },
  neon: { id: 'vessel-society', name: 'Vessel Society', creator: 'Theo Marsh' },
  golden: { id: 'golden-frequencies', name: 'Golden Frequencies', creator: 'Luma Reyes' },
}

const TRAITS: Record<Character, string[]> = {
  emerald: ['Óculos', 'Esmeralda', 'Jaqueta college'],
  sage: ['Chapéu bucket', 'Moletom', 'Pelagem cinza'],
  neon: ['Blazer', 'Gola alta', 'Brinco dourado'],
  golden: ['Fones de ouvido', 'Pelagem dourada', 'Jaqueta bomber'],
}

const RARITY = ['Comum', 'Incomum', 'Raro', 'Épico'] as const

/** Gerador pseudoaleatório com semente: mesma semente → mesma sequência. */
function createRandom(seed: number) {
  let state = seed
  const next = () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    pick: <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)] as T,
    chance: (probability: number) => next() < probability,
  }
}

const SEED = 42
let random = createRandom(SEED)

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/#/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function hex(length: number) {
  return Array.from({ length }, () => random.int(0, 15).toString(16))
    .join('')
    .toUpperCase()
}

/** Preço da edição 1/1 e 1/10 a partir do preço base (1/50 e aberta). */
function scalePrice(base: string, factorTimesTen: number) {
  return formatWei((parseEth(base) * BigInt(factorTimesTen)) / 10n)
}

function buildEditions(id: string, base: string, soldOut: boolean): NftEdition[] {
  const editions: NftEdition[] = [
    {
      id: `${id}-1-1`,
      label: '1/1',
      supply: 1,
      available: soldOut ? 0 : random.int(0, 1),
      price: multiplyEth(base, 3),
      maxPerOrder: 1,
    },
    {
      id: `${id}-1-10`,
      label: '1/10',
      supply: 10,
      available: soldOut ? 0 : random.int(0, 6),
      price: scalePrice(base, 15),
      maxPerOrder: 2,
    },
    {
      id: `${id}-1-50`,
      label: '1/50',
      supply: 50,
      available: soldOut ? 0 : random.int(3, 30),
      price: base,
      maxPerOrder: 5,
    },
  ]
  if (!soldOut && random.chance(0.6)) {
    editions.push({
      id: `${id}-open`,
      label: 'Aberta',
      supply: null,
      available: 999,
      price: base,
      maxPerOrder: 10,
    })
  }
  return editions
}

interface Seed {
  name: string
  character: Character
  price: string
  compareAtPrice?: string
  category?: CategoryId
  network?: NetworkId
  soldOut?: boolean
}

/** Os 9 primeiros reproduzem a primeira página do Figma (ordem "Listados recentemente"). */
const DESIGN_SEEDS: Seed[] = [
  {
    name: 'Emerald Ape #042',
    character: 'emerald',
    price: '1.19',
    category: 'digital-art',
    network: 'ethereum',
  },
  {
    name: 'Sage Nomad #009',
    character: 'sage',
    price: '1.69',
    category: 'digital-art',
    network: 'ethereum',
  },
  {
    name: 'Neon Vessel #552',
    character: 'neon',
    price: '1.99',
    compareAtPrice: '2.29',
    category: 'collectibles',
    network: 'polygon',
  },
  {
    name: 'Cosmic Bloom #118',
    character: 'sage',
    price: '1.29',
    category: 'generative',
    network: 'solana',
  },
  {
    name: 'Violet Nomad #314',
    character: 'sage',
    price: '1.39',
    category: 'digital-art',
    network: 'ethereum',
  },
  {
    name: 'Ivory Baron #088',
    character: 'neon',
    price: '1.79',
    category: '3d-art',
    network: 'ethereum',
  },
  {
    name: 'Golden Beat #207',
    character: 'golden',
    price: '0.99',
    category: 'music',
    network: 'polygon',
  },
  {
    name: 'Golden Frequency #071',
    character: 'golden',
    price: '0.59',
    category: 'music',
    network: 'solana',
  },
  {
    name: 'Golden Signal #160',
    character: 'golden',
    price: '0.39',
    category: 'music',
    network: 'ethereum',
  },
]

const ADJECTIVES = [
  'Amber',
  'Velvet',
  'Copper',
  'Midnight',
  'Crimson',
  'Silver',
  'Jade',
  'Onyx',
  'Cobalt',
  'Saffron',
  'Rustic',
  'Lunar',
  'Solar',
  'Hazel',
  'Ember',
  'Frost',
  'Mossy',
  'Royal',
  'Quiet',
  'Electric',
] as const

const NOUNS: Record<Character, readonly string[]> = {
  emerald: ['Ape', 'Maverick', 'Prodigy'],
  sage: ['Nomad', 'Drifter', 'Wanderer'],
  neon: ['Vessel', 'Baron', 'Curator'],
  golden: ['Beat', 'Signal', 'Groove'],
}

const CHARACTERS: Character[] = ['emerald', 'sage', 'neon', 'golden']

function generatedSeeds(count: number): Seed[] {
  const used = new Set(DESIGN_SEEDS.map((s) => s.name))
  const seeds: Seed[] = []
  for (let i = 0; seeds.length < count; i++) {
    const character = CHARACTERS[i % CHARACTERS.length] as Character
    const name = `${random.pick(ADJECTIVES)} ${random.pick(NOUNS[character])} #${String(random.int(1, 999)).padStart(3, '0')}`
    if (used.has(name)) continue
    used.add(name)
    // Faixa do Figma: 0,02 a 12,30 ETH (os extremos aparecem uma vez cada).
    const cents = seeds.length === 0 ? 2 : seeds.length === 1 ? 1230 : random.int(5, 600)
    const price = formatWei(BigInt(cents) * 10n ** 16n)
    const onSale = random.chance(0.15)
    seeds.push({
      name,
      character,
      price,
      compareAtPrice: onSale ? formatWei((BigInt(cents) * 10n ** 16n * 12n) / 10n) : undefined,
      soldOut: seeds.length % 13 === 5,
    })
  }
  return seeds
}

const BASE_DATE = Date.UTC(2026, 10, 20, 12, 0, 0)
const HOUR = 60 * 60 * 1000

function buildRecord(seed: Seed, index: number): NftRecord {
  const id = slugify(seed.name)
  const collection = COLLECTIONS[seed.character]
  const number = seed.name.split('#')[1] ?? '000'
  const editions = buildEditions(id, seed.price, seed.soldOut ?? false)
  const rarity = random.pick(RARITY)
  const network = seed.network ?? random.pick(NETWORK_IDS)
  const networkName = network.charAt(0).toUpperCase() + network.slice(1)
  const image = ART[seed.character]

  return {
    id,
    name: seed.name,
    image,
    price: seed.price,
    compareAtPrice: seed.compareAtPrice ?? null,
    category: seed.category ?? random.pick(CATEGORY_IDS),
    network,
    soldOut: seed.soldOut ?? false,
    version: 1,
    tokenId: `#0${number}`,
    collection: { id: collection.id, name: collection.name },
    creator: collection.creator,
    description: `Um colecionável digital finalizado à mão da coleção ${collection.name}, verificado na ${networkName}, com arte desbloqueável e acesso para colecionadores.`,
    story: [
      `${seed.name} é uma obra digital finalizada à mão da coleção ${collection.name}. Cada atributo fica armazenado nos metadados do token e verificado na ${networkName}. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.`,
      `A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. ${collection.creator} recebe 5% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.`,
    ],
    attributes: [...TRAITS[seed.character].slice(0, 2), rarity],
    rating: random.int(40, 50) / 10,
    reviewCount: random.int(3, 48),
    royaltyPercent: 5,
    contractAddress: `0x${hex(4)}...${hex(4)}`,
    gallery: [image],
    editions,
    listedAt: new Date(BASE_DATE - index * 7 * HOUR).toISOString(),
    isNew: index < 14,
    isTrending: index % 4 === 1 || index % 7 === 0,
  }
}

/** Catálogo inicial (48 NFTs): sempre o mesmo, em qualquer máquina. */
export function createNftFixtures(): NftRecord[] {
  random = createRandom(SEED)
  return [...DESIGN_SEEDS, ...generatedSeeds(39)].map(buildRecord)
}

/** Ids usados nos destaques da Início. */
export const FEATURED_IDS = {
  hero: ['emerald-ape-042', 'neon-vessel-552', 'golden-beat-207'],
  spotlight: 'violet-nomad-314',
} as const
