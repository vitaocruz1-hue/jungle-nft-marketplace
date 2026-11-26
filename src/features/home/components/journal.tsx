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
                src={post.image}
                alt=""
                width={496}
                height={496}
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
