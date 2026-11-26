import { Link } from '@tanstack/react-router'

import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  TwitterIcon,
  YoutubeIcon,
} from '@/components/brand-icons'
import { ComingSoonButton } from '@/components/coming-soon'
import { notifyComingSoon } from '@/lib/coming-soon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CategoryId } from '@/contracts/catalog'
import { CATEGORY_LABELS } from '@/contracts/catalog'
import { cn } from '@/lib/utils'

import { Container } from './container'

const FEATURES = [
  {
    letter: 'W',
    title: 'Segurança da carteira',
    text: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    letter: 'C',
    title: 'Criadores em destaque',
    text: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    letter: 'D',
    title: 'Alertas de lançamentos',
    text: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
]

const FOOTER_CATEGORIES: CategoryId[] = ['digital-art', 'photography', 'music', '3d-art', 'utility']

const SOCIAL_LINKS = [
  { label: 'Facebook', href: 'https://www.facebook.com', Icon: FacebookIcon },
  { label: 'Instagram', href: 'https://www.instagram.com', Icon: InstagramIcon },
  { label: 'Twitter', href: 'https://twitter.com', Icon: TwitterIcon },
  { label: 'LinkedIn', href: 'https://www.linkedin.com', Icon: LinkedinIcon },
  { label: 'YouTube', href: 'https://www.youtube.com', Icon: YoutubeIcon },
]

const linkClass = 'text-sm text-foreground transition-colors hover:text-highlight'
const headingClass = 'text-lg font-bold'

function NewsletterForm() {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        notifyComingSoon('Newsletter')
      }}
      aria-labelledby="newsletter-titulo"
    >
      <h2 id="newsletter-titulo" className="text-lg leading-tight font-bold">
        Antecipe-se ao próximo lançamento
      </h2>
      <div className="mt-4 flex">
        <Label htmlFor="newsletter-email" className="sr-only">
          Seu e-mail
        </Label>
        <Input
          id="newsletter-email"
          type="email"
          required
          autoComplete="email"
          placeholder="digite seu e-mail..."
          aria-describedby="newsletter-ajuda"
          className="h-10 rounded-r-none border-0 bg-secondary placeholder:text-muted-foreground/80"
        />
        <Button type="submit" className="h-10 rounded-l-none px-4 text-lg font-bold">
          Enviar
        </Button>
      </div>
      <p id="newsletter-ajuda" className="mt-4 text-sm leading-6 text-muted-foreground">
        Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
      </p>
    </form>
  )
}

export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={cn('mt-24', className)}>
      <Container>
        <div className="bg-card">
          <div className="grid gap-10 px-6 py-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:px-10">
            {FEATURES.map((feature) => (
              <section
                key={feature.title}
                className="lg:border-r lg:border-primary/80 lg:px-6 lg:first:pl-0"
              >
                <span
                  aria-hidden="true"
                  className="grid size-17.5 place-items-center rounded-full bg-primary text-xl font-bold text-primary-foreground"
                >
                  {feature.letter}
                </span>
                <h2 className="mt-4 text-[17px] font-bold">{feature.title}</h2>
                <p className="mt-3 text-sm leading-[22px] text-muted-foreground">{feature.text}</p>
              </section>
            ))}
            <div className="lg:pl-6">
              <NewsletterForm />
            </div>
          </div>

          <div className="grid gap-4 bg-secondary px-6 py-8 sm:grid-cols-2 lg:grid-cols-4 lg:items-center lg:px-10">
            <p className="font-bold tracking-wide">KURIO</p>
            <p className="text-sm leading-6 sm:text-base">
              Feito para colecionadores, criadores e cultura
            </p>
            <a href="mailto:contato@email.com" className={linkClass}>
              contato@email.com
            </a>
            <a href="tel:+551140028922" className={linkClass}>
              +55 11 4002 8922
            </a>
          </div>

          <div className="grid gap-10 px-6 py-10 sm:grid-cols-2 lg:grid-cols-4 lg:px-10">
            <nav aria-labelledby="rodape-perfil">
              <h2 id="rodape-perfil" className={headingClass}>
                Meu perfil
              </h2>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link to="/perfil" className={linkClass}>
                    Meu perfil
                  </Link>
                </li>
                {['Minha coleção', 'Atividade'].map((item) => (
                  <li key={item}>
                    <Link to="/pedidos" className={linkClass}>
                      {item}
                    </Link>
                  </li>
                ))}
                <li>
                  <ComingSoonButton section="Estúdio do criador" className={linkClass}>
                    Estúdio do criador
                  </ComingSoonButton>
                </li>
                <li>
                  <Link to="/favoritos" className={linkClass}>
                    Lista de interesse
                  </Link>
                </li>
              </ul>
            </nav>

            <nav aria-labelledby="rodape-ajuda">
              <h2 id="rodape-ajuda" className={headingClass}>
                Central de ajuda
              </h2>
              <ul className="mt-4 space-y-3">
                {[
                  'Central de ajuda',
                  'Como comprar NFTs',
                  'Carteira e segurança',
                  'Política do mercado',
                  'Denunciar item',
                ].map((item) => (
                  <li key={item}>
                    <ComingSoonButton section={item} className={linkClass}>
                      {item}
                    </ComingSoonButton>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-labelledby="rodape-colecoes">
              <h2 id="rodape-colecoes" className={headingClass}>
                Coleções
              </h2>
              <ul className="mt-4 space-y-3">
                {FOOTER_CATEGORIES.map((category) => (
                  <li key={category}>
                    <Link to="/" search={{ category }} hash="catalogo" className={linkClass}>
                      {CATEGORY_LABELS[category]}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div>
              <h2 className={headingClass}>Redes sociais</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${label} (abre em nova aba)`}
                      className="grid size-8 place-items-center rounded-md border border-primary text-highlight transition-colors hover:bg-primary hover:text-primary-foreground"
                    >
                      <Icon className="size-4" />
                    </a>
                  </li>
                ))}
              </ul>
              <h2 className={`${headingClass} mt-8`}>Carteiras compatíveis</h2>
              <p className="mt-3 inline-flex flex-wrap items-center gap-2 rounded-md border border-[#8b5b33] bg-secondary/60 px-2 py-1.5 text-[10px] font-bold tracking-wide text-highlight uppercase">
                <span>MetaMask</span>
                <span aria-hidden="true">•</span>
                <span>WalletConnect</span>
                <span aria-hidden="true">•</span>
                <span>Coinbase</span>
              </p>
            </div>
          </div>
        </div>

        <p className="py-6 text-center text-sm">© 2026 Kurio. Propriedade digital para todos.</p>
      </Container>
    </footer>
  )
}
