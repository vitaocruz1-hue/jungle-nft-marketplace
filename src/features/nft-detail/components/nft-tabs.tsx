import { RatingStars } from '@/components/rating-stars'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { NftDetail } from '@/contracts/catalog'
import { NETWORK_LABELS } from '@/contracts/catalog'

const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'UTC' })

const triggerClass =
  'h-auto flex-initial rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pb-2 text-left text-sm whitespace-normal sm:text-base text-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:font-bold data-[state=active]:text-highlight data-[state=active]:shadow-none'

export function NftTabs({ nft }: { nft: NftDetail }) {
  const network = NETWORK_LABELS[nft.network]

  return (
    <Tabs defaultValue="detalhes" className="mt-16 gap-0">
      <TabsList className="h-auto w-full justify-start gap-8 rounded-none border-b border-[#442c1a] bg-transparent p-0">
        <TabsTrigger value="detalhes" className={triggerClass}>
          Detalhes do NFT
        </TabsTrigger>
        <TabsTrigger value="avaliacoes" className={triggerClass}>
          Avaliações de colecionadores ({nft.reviewCount})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="detalhes" className="pt-6 type-body text-muted-foreground">
        {nft.story.map((paragraph) => (
          <p key={paragraph.slice(0, 24)} className="mb-4 measure">
            {paragraph}
          </p>
        ))}
        <dl className="mt-6 space-y-4">
          <div>
            <dt className="font-bold text-foreground">Rede:</dt>
            <dd>Cunhado na {network} com procedência imutável e metadados armazenados no IPFS.</dd>
          </div>
          <div>
            <dt className="font-bold text-foreground">Contrato:</dt>
            <dd>
              <span className="font-mono">{nft.contractAddress}</span> · Contrato inteligente
              ERC-721 verificado.
            </dd>
          </div>
          <div>
            <dt className="font-bold text-foreground">Direitos autorais:</dt>
            <dd>
              Direitos autorais do criador: {nft.royaltyPercent}% nas vendas secundárias, pagos
              automaticamente pelos mercados compatíveis.
            </dd>
          </div>
        </dl>
      </TabsContent>

      <TabsContent value="avaliacoes" className="pt-6">
        <p className="flex items-center gap-2 type-body">
          <RatingStars rating={nft.rating} />
          {nft.reviewCount} avaliações · mostrando as mais recentes
        </p>
        <ul className="mt-4 space-y-4">
          {nft.reviews.map((review) => (
            <li key={review.id} className="rounded-md bg-card p-5">
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 type-body">
                <strong>{review.author}</strong>
                <RatingStars rating={review.rating} />
                <time dateTime={review.createdAt} className="type-caption text-muted-foreground">
                  {dateFormat.format(new Date(review.createdAt))}
                </time>
              </p>
              <p className="mt-2 measure type-body text-muted-foreground">{review.comment}</p>
            </li>
          ))}
        </ul>
      </TabsContent>
    </Tabs>
  )
}
