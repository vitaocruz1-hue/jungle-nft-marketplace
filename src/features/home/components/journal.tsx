import { ComingSoonButton } from '@/components/coming-soon'

/** Dimensões reais dos arquivos (o navegador reserva o espaço antes de carregar). */
const NEON_VESSEL = { src: '/images/nfts/neon-vessel.webp', width: 496, height: 496 }
const EMERALD_APE = { src: '/images/nfts/emerald-ape.webp', width: 512, height: 512 }
const SAGE_NOMAD = { src: '/images/nfts/sage-nomad.webp', width: 496, height: 496 }
const GOLDEN_BEAT = { src: '/images/nfts/golden-beat.webp', width: 496, height: 496 }

/** Conteúdo editorial (fora do escopo do desafio): textos fixos, sem API. */
const POSTS = [
  {
    date: '12 de setembro',
    readTime: 6,
    title: 'Como funciona a propriedade de NFTs',
    text: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    image: NEON_VESSEL,
  },
  {
    date: '13 de setembro',
    readTime: 2,
    title: '10 artistas digitais para acompanhar',
    text: 'Conheça criadores que moldam a cultura digital.',
    image: EMERALD_APE,
  },
  {
    date: '15 de setembro',
    readTime: 3,
    title: 'Raridade, atributos e procedência',
    text: 'Entenda raridade, procedência, direitos autorais e utilidade.',
    image: SAGE_NOMAD,
  },
  {
    date: '15 de setembro',
    readTime: 2,
    title: 'Como proteger sua carteira',
    text: 'Proteja sua carteira, seus ativos e sua identidade.',
    image: GOLDEN_BEAT,
  },
]

export function Journal() {
  return (
    <section aria-labelledby="diario-titulo" className="mt-24 lg:mt-[98px] lg:pb-1.5">
      <h2 id="diario-titulo" className="text-center type-display">
        Diário da Cunhagem
      </h2>
      <p className="mx-auto mt-3 max-w-3xl text-center type-body text-muted-foreground">
        Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
      </p>

      <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-[repeat(4,268px)]">
        {POSTS.map((post) => (
          <li key={post.title}>
            <article className="flex h-full flex-col overflow-hidden rounded-md bg-card">
              <img
                src={post.image.src}
                alt=""
                width={post.image.width}
                height={post.image.height}
                loading="lazy"
                decoding="async"
                className="aspect-[268/195] w-full rounded-t-md object-cover"
              />
              <div className="flex flex-1 flex-col p-5">
                <p className="type-caption text-muted-foreground">
                  {post.date} <span aria-hidden="true">&nbsp;|&nbsp;</span> Leitura de{' '}
                  {post.readTime} min
                </p>
                <h3 className="mt-3 type-title">{post.title}</h3>
                <p className="mt-2 flex-1 type-body text-muted-foreground">{post.text}</p>
                <ComingSoonButton
                  section="Diário da Cunhagem"
                  className="mt-4 self-start type-body font-bold text-highlight hover:underline"
                >
                  Ler mais <span aria-hidden="true">→</span>
                  <span className="sr-only">: {post.title}</span>
                </ComingSoonButton>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  )
}
