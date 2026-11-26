import { ComingSoonButton } from '@/components/coming-soon'

/** Conteúdo editorial (fora do escopo do desafio): textos fixos, sem API. */
const POSTS = [
  {
    date: '12 de setembro',
    readTime: 6,
    title: 'Como funciona a propriedade de NFTs',
    text: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    image: '/images/nfts/neon-vessel.webp',
  },
  {
    date: '13 de setembro',
    readTime: 2,
    title: '10 artistas digitais para acompanhar',
    text: 'Conheça criadores que moldam a cultura digital.',
    image: '/images/nfts/emerald-ape.webp',
  },
  {
    date: '15 de setembro',
    readTime: 3,
    title: 'Raridade, atributos e procedência',
    text: 'Entenda raridade, procedência, direitos autorais e utilidade.',
    image: '/images/nfts/sage-nomad.webp',
  },
  {
    date: '15 de setembro',
    readTime: 2,
    title: 'Como proteger sua carteira',
    text: 'Proteja sua carteira, seus ativos e sua identidade.',
    image: '/images/nfts/golden-beat.webp',
  },
]

export function Journal() {
  return (
    <section aria-labelledby="diario-titulo" className="mt-24 lg:mt-[98px] lg:pb-1.5">
      <h2
        id="diario-titulo"
        className="text-center text-2xl font-bold sm:text-[32px] lg:text-[28px]"
      >
        Diário da Cunhagem
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-muted-foreground lg:mt-[11px] lg:max-w-3xl">
        Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
      </p>

      <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:mt-[39px] lg:grid-cols-4 xl:grid-cols-[repeat(4,268px)]">
        {POSTS.map((post) => (
          <li key={post.title}>
            <article className="flex h-full flex-col overflow-hidden rounded-md bg-card">
              <img
                src={post.image}
                alt=""
                width={496}
                height={496}
                loading="lazy"
                decoding="async"
                className="aspect-[268/195] w-full rounded-t-md object-cover"
              />
              <div className="flex flex-1 flex-col p-4 lg:pt-3 lg:pb-2">
                <p className="text-xs text-muted-foreground">
                  {post.date} <span aria-hidden="true">&nbsp;|&nbsp;</span> Leitura de{' '}
                  {post.readTime} min
                </p>
                <h3 className="mt-3 text-base leading-snug font-bold lg:mt-2 lg:leading-[21px]">
                  {post.title}
                </h3>
                <p className="mt-2 flex-1 text-xs leading-5 text-muted-foreground lg:mt-2 lg:leading-4">
                  {post.text}
                </p>
                <ComingSoonButton
                  section="Diário da Cunhagem"
                  className="mt-3 text-sm font-bold text-highlight hover:underline lg:mt-1.5"
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
