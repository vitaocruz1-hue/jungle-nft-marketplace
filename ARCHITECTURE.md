# Arquitetura

## Visão geral

```text
 Tela (React + shadcn/ui + Tailwind)
   │  hooks por domínio (src/features/*)
   ▼
 TanStack Query (cache)  ◄──────────── Socket.IO client (nft.updated, order.updated)
   │  funções de API                                ▲
   ▼                                                │ eventos (protocolo Socket.IO)
 Axios (src/lib/api-client) ── REST /api/* ──►  MSW: handlers + "banco" + Socket.IO simulado
                                                    (src/mocks — fora do app)
 TanStack Router: rotas, estado da URL (busca/filtros), proteção das rotas privadas (_auth)
```

| Pasta            | Responsabilidade                                                                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/contracts`  | Tipos e regras compartilhados entre app e API simulada (contratos REST, eventos, validações). Mudou aqui, o TypeScript aponta os dois lados. |
| `src/routes`     | Telas e regras de rota (loaders, `validateSearch`, `pendingComponent`, `notFound`, `_auth`).                                                 |
| `src/features`   | Lógica por domínio: chamadas Axios, `queryOptions`, mutations e componentes da feature.                                                      |
| `src/components` | Layout, componentes compartilhados e `ui/` (componentes oficiais do shadcn/ui, via CLI, adaptados aos tokens do Figma).                      |
| `src/lib`        | Infraestrutura: cliente Axios e interceptors, `ApiError`, `QueryClient`, aritmética de ETH (BigInt), sessão.                                 |
| `src/mocks`      | API simulada: handlers MSW, Socket.IO, banco persistente, cenários, painel e controles.                                                      |

**Fronteira app × mocks (verificada pelo ESLint):** o app não pode usar `fetch` (só o Axios) nem
importar `src/mocks` (estático ou dinâmico). Só o `main.tsx` liga o MSW. Componentes, hooks e o
cliente Axios não contêm respostas fictícias nem caminhos alternativos de negócio.

## Contratos REST

Base `/api`. Corpo de erro único (`ApiErrorBody`): `{ error: { code, message, fieldErrors? } }`.
O interceptor do Axios converte qualquer falha em `ApiError` (`code`, `status`, `fieldErrors`,
`isTransient`). Tipos completos em `src/contracts/*.ts`.

| Recurso   | Método e rota                                                                                                               | Notas / erros                                                                                                                                                                   |
| --------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sessão    | `POST /auth/register` `{username,email,password}` → `AuthResponse`                                                          | 422 validação · 409 e-mail/usuário em uso                                                                                                                                       |
|           | `POST /auth/login` `{email,password}` → `AuthResponse` `{token,user,expiresAt}`                                             | 401 credenciais                                                                                                                                                                 |
|           | `GET /auth/session` → `{user,expiresAt}`                                                                                    | 401 `UNAUTHENTICATED` / `SESSION_EXPIRED`                                                                                                                                       |
|           | `POST /auth/logout` → 204                                                                                                   |                                                                                                                                                                                 |
| NFTs      | `GET /nfts?search&category&network&minPrice&maxPrice&tab&sort&page&pageSize` → `NftListResponse`                            | itens + paginação + contadores por filtro + faixa de preço · 400 parâmetros inválidos                                                                                           |
|           | `GET /featured` → destaques (carrossel e "NFT em destaque")                                                                 |                                                                                                                                                                                 |
|           | `GET /nfts/:id` → `NftDetail` (edições, galeria, avaliações)                                                                | 404                                                                                                                                                                             |
|           | `GET /nfts/:id/related?exclude=id1,id2` → `NftSummary[]` (até 8, alternando personagens)                                    | 404                                                                                                                                                                             |
| Favoritos | `GET /favorites` · `PUT /favorites/:nftId` · `DELETE /favorites/:nftId` → `{nftIds}`                                        | 401 · 404 · 503 (cenário)                                                                                                                                                       |
| Carrinho  | `GET /cart` → `Cart` (itens com preço/estoque **atuais**, avisos, cupom e totais)                                           | visitante: `X-Cart-Id`; logado: token                                                                                                                                           |
|           | `POST /cart/items` `{nftId,editionId,quantity}` · `PATCH /cart/items/:id` `{quantity}` · `DELETE /cart/items/:id`           | 404 · 409 `OUT_OF_STOCK` · 422 limite por pedido/estoque                                                                                                                        |
|           | `PUT /cart/coupon` `{code}` · `DELETE /cart/coupon`                                                                         | 422 `COUPON_INVALID` / `COUPON_EXPIRED`                                                                                                                                         |
|           | `POST /cart/acknowledge` (aceitar novos preços)                                                                             |                                                                                                                                                                                 |
| Cotação   | `POST /quote` `{network}` → `Quote` (itens, cupom, subtotal, desconto, taxa da rede, total, `expiresAt`)                    | 401 · 409 sem estoque · 422 carrinho vazio/rede                                                                                                                                 |
| Pedidos   | `POST /orders` + cabeçalho `Idempotency-Key`, `{quoteId,walletId,buyer}` → `Order`                                          | mesma chave + mesmo corpo → mesmo pedido (200) · corpo diferente → 409 `IDEMPOTENCY_CONFLICT` · 409 `QUOTE_EXPIRED` / `PRICE_CHANGED` / `OUT_OF_STOCK` / `COUPON_EXPIRED` · 422 |
|           | `GET /orders/:id` → `Order`                                                                                                 | 404 também para pedido de outro usuário                                                                                                                                         |
| Perfil    | `GET /profile` · `PATCH /profile` · `PUT /profile/avatar` `{dataUrl}` · `DELETE /profile/avatar` · `POST /profile/password` | 422 · 409 conflito                                                                                                                                                              |
| Carteiras | `GET /wallets` → `{primary,secondary}` · `PUT /wallets/:slot`                                                               | 422 (mesma `validateWallet` do app)                                                                                                                                             |
|           | `POST /wallets/:id/connect` (conexão simulada)                                                                              | 403 recusada (cenário)                                                                                                                                                          |

Erros de rede e timeout (Axios, 10 s) viram `NETWORK_ERROR` / `TIMEOUT`.

## Eventos Socket.IO

Cliente: `socket.io-client`, transporte WebSocket, caminho `/realtime`, token no `auth` do
pacote CONNECT. Todo evento tem `eventId` (identidade estável), `resource` (`{type,id}`) e
`version` (versão do recurso após a mudança).

| Evento          | Destino                       | Payload (`src/contracts/realtime.ts`)                                 | Efeito no app                                                                                                                                                             |
| --------------- | ----------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nft.updated`   | todos os clientes             | preço, preço anterior, esgotado, edições (`id`, `price`, `available`) | atualiza catálogo, destaques, relacionados e detalhe (só se `version` for maior); se o NFT está no carrinho, rebusca o carrinho e avisa; no pagamento, invalida a cotação |
| `order.updated` | só conexões do dono do pedido | `status`, `failureReason`, `userId`                                   | atualiza o pedido e rebusca pela API; confirmado → rebusca o carrinho                                                                                                     |

**Tolerância:** um filtro por conexão descarta `eventId` já visto e `version` ≤ última aplicada
do mesmo recurso; os patches no cache também comparam com a `version` do dado em cache.
Eventos de pedido com `userId` diferente do usuário atual são descartados.

**Ciclo de vida:** uma conexão por sessão (efeito dependente do token). Login, logout ou troca de
usuário encerram a conexão anterior e removem todos os listeners.

**Transporte simulado:** o MSW intercepta o WebSocket e o `@mswjs/socket.io-binding` codifica o
protocolo. Limitações e ajustes:

- só transporte WebSocket (sem polling HTTP), sem salas nem namespaces;
- a ponte responde o handshake, mas não envia os pings do Engine.IO: o mock envia `2` a cada 20 s;
- o MSW reescreve `/socket.io/` ao casar a URL, por isso o caminho é `/realtime`;
- o `engine.io-client` guarda a referência ao `WebSocket` ao ser importado: o `socket.io-client`
  é carregado sob demanda, depois de o MSW iniciar (`whenNetworkReady()`);
- mudanças nos dados simulados (painel, compras, liquidação) passam pelo banco e geram tanto a
  resposta REST quanto o evento correspondente.

## Reconciliação REST × Socket.IO

- A cada conexão do socket, **inclusive a primeira**, o app invalida catálogo, carrinho e dados
  privados ativos. Isso cobre eventos emitidos enquanto não havia conexão (ex.: pedido confirmado
  entre o F5 e a conexão). Dados iguais não redesenham a tela (structural sharing).
- Durante uma queda, a página de pedido mostra "Reconectando…"; o pedido continua sendo processado
  pelo mock e o estado final chega pelo evento ou pela reconciliação.
- Pedidos pendentes sobrevivem ao F5: o mock retoma a liquidação ao iniciar.

## Política de sessão

- Login/cadastro devolvem um token opaco (`localStorage`), enviado pelo interceptor do Axios em
  `Authorization: Bearer`. Senhas nunca são guardadas: o banco simulado tem só hash SHA-256 com sal
  (sal novo a cada troca de senha). Sessão de 30 minutos.
- `GET /auth/session` valida o token ao abrir o app; a rota `_auth` (perfil, carteiras, pagamento,
  pedido) redireciona para `/login?redirect=<página>`.
- 401 em qualquer chamada **autenticada** encerra a sessão uma única vez: limpa o token e os dados
  privados do cache, avisa e leva ao login com `redirect` + `motivo=expirada`. Após entrar, a
  pessoa volta à mesma página; o formulário de pagamento é restaurado do rascunho (`sessionStorage`).
- Logout e troca de usuário apagam do cache tudo sob `['me', userId, …]`, `['cart', …]` e
  `['session', …]`, e reiniciam a conexão Socket.IO.
- Redirecionamentos só aceitam caminhos internos (evita redirecionamento aberto).

## Estado do carrinho

- O carrinho vive na API simulada; a interface só exibe o que ela calcula (subtotal, desconto,
  taxa, total). Visitante: id do carrinho guardado no navegador e enviado em `X-Cart-Id`.
- Ao entrar ou cadastrar, a API funde o carrinho do visitante no da conta (quantidades limitadas
  pelo estoque e pelo limite por pedido; cupom preservado).
- Cada item traz o preço e o estoque **atuais** e avisos (`PRICE_CHANGED`, `OUT_OF_STOCK`,
  `QUANTITY_UNAVAILABLE`). O checkout fica bloqueado até resolver; preço alterado exige aceite.
- ETH trafega como string decimal e é calculado com BigInt em wei (`src/lib/eth.ts`);
  quantidades são inteiras.
- Após um pedido confirmado, só os itens e quantidades comprados saem do carrinho; em falha ou
  recusa, nada é removido.

## Pagamento e pedidos

1. **Formulário** pré-preenchido (perfil + carteira principal), com rascunho na aba.
2. **Revisar pedido** valida os campos e cria a **cotação** na API, que vira a referência de preço.
3. **Revisão:** se chegar `nft.updated` de um item ou a cotação vencer, a confirmação trava até
   "Atualizar cotação" (nova cotação = nova confirmação).
4. **Confirmar compra:** conecta a carteira (simulado: aceita, recusa, desconectar) e envia o pedido
   com `Idempotency-Key` (uma por cotação, guardada na aba). Cliques repetidos são travados; timeout
   ou erro de rede repetem com a **mesma** chave e recuperam o mesmo pedido. A API revalida preço,
   estoque e cupom; 409 volta para o formulário com explicação.
5. **Pedido** nasce `pending` (estoque reservado) e termina `confirmed` ou `declined`, notificado por
   `order.updated`. O recibo só aparece para pedido confirmado e usa o snapshot do pedido.

## Estratégia de cache (TanStack Query)

| Política             | Valor                                                                                                                                                       |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `staleTime`          | 30 s (sessão: 5 min)                                                                                                                                        |
| Retries de queries   | Até 2, só para falhas passageiras (rede, timeout, 5xx); 4xx não repete                                                                                      |
| Retries de mutations | Nunca automáticos (evita compra duplicada); o pedido repete explicitamente com a mesma chave                                                                |
| Chaves               | Catálogo: `['nfts','list',params]`, `['nfts','detail',id]`… · privados: `['me',userId,…]` · carrinho: `['cart',token\|'guest']`                             |
| Respostas obsoletas  | Cada combinação de filtros tem sua chave; o `AbortSignal` do Query cancela a requisição antiga; a lista anterior fica visível (esmaecida) até a nova chegar |
| Atualização otimista | Favoritos: aplica na hora, rollback em falha e ressincroniza com a API ao final                                                                             |
| Invalidação          | Mutations de carrinho gravam a resposta da API no cache; eventos e reconexões invalidam o que mudou                                                         |
| Prefetch             | Loaders das rotas iniciam as consultas; links pré-carregam ao passar o mouse (`defaultPreload: 'intent'`)                                                   |

## Mocks (MSW)

- Handlers por domínio em `src/mocks/handlers`; `failures.ts` vem primeiro e simula falhas
  conforme o cenário.
- Banco em memória com persistência no `localStorage` (com versão de esquema) e reset completo.
- Fixtures determinísticas: 48 NFTs (os 9 primeiros reproduzem o Figma), 2 usuários, carteira da
  Ana; o gerador pseudoaleatório usa semente fixa. Os NFTs gerados alternam 12 artes (4 personagens
  × inteira/rosto/roupa) e as recomendações fazem rodízio por personagem, para a mesma imagem não
  se repetir lado a lado.
- Cenários escolhidos por `?cenario=` ou pelo painel; controles em `window.__kurioMocks` para testes.

## Interface, acessibilidade e desvios do Figma

- **Assets:** o conector do Figma não tinha acesso ao arquivo. As artes dos NFTs foram recortadas
  das exportações PNG (Início @2x) e convertidas para WebP, incluindo dois recortes de detalhe
  por personagem para a galeria. A fonte Roboto Mono é servida localmente (`@fontsource`). Os
  ícones de redes sociais são SVGs próprios (o lucide não tem marcas).
- **Rótulos:** Login e Cadastro usam só placeholders no Figma; os campos têm rótulos visíveis
  apenas para leitores de tela.
- **Login/Cadastro:** no Figma é um modal sobre a Início; aqui são rotas (`/login`, `/cadastro`) com o
  mesmo painel, para permitir acesso direto e retorno à página anterior.
- **Carrossel do destaque:** sem rotação automática (exigiria controle de pausa).
- **Aba "Detalhes do NFT":** no Figma os rótulos "Contrato" e "Direitos autorais" estão trocados;
  foram corrigidos.
- **Pagamento:** endereço, ENS e tipo de carteira vêm da carteira selecionada (somente leitura); a
  rede escolhida define a taxa da cotação. "Nome ENS" usa campo + sufixo `.eth` fixo.
- **Perfil:** troca de senha tem botão próprio (o Figma tem um único "Salvar").
- **Fora do escopo:** Criadores, Aprenda, Diário da Cunhagem, Central de ajuda, newsletter, login
  social e itens do menu do perfil (Atividade, Ofertas…) mostram "em breve" sem simular sucesso.
  "Ver no Etherscan" abre o explorador da rede com a referência simulada.
- **Responsivo:** 390/768/1440 px; filtros em gaveta e menu lateral abaixo de 1024/768 px.
- **Acessibilidade:** link "pular para o conteúdo", foco visível, foco preso em diálogos/gavetas
  (Radix), erros ligados aos campos com foco no primeiro inválido, `aria-live` para resultados,
  mudanças de preço, totais e estado do pedido, estados não dependentes só de cor (texto
  "Esgotado", "Favoritado", preço anterior riscado com rótulo) e skeletons estáticos com
  `prefers-reduced-motion`.

## Performance

Medianas de 3 execuções (detalhes em `lighthouse/reports/summary.md`): desktop 97/98;
mobile 67 (Início) e 66 (Detalhe). Acessibilidade 100, Boas práticas 96 e SEO 100 em todos.

**Causas do mobile abaixo de 90.** O perfil mobile simula CPU 4× mais lenta. O LCP (arte
principal) depende de JavaScript: iniciar o MSW (exigido no cenário auditado), executar o React e
receber os dados simulados. O TBT vem da avaliação do React e do MSW e das renderizações iniciais
(skeleton → dados).

**O que foi feito:** carregamento do app em paralelo com o MSW, com a rede aguardando o mock;
`socket.io-client` sob demanda; code splitting por rota; imagens WebP com dimensões declaradas e
`fetchpriority` no LCP; fonte local; altura mínima do conteúdo (CLS 0,197 → 0).

**Tentativas descartadas (medidas):** carregamento sequencial (MSW → app) e preload da fonte e
da imagem do destaque. No 4G simulado os preloads disputaram banda com o JavaScript, e nenhuma
variante passou de ~70 no mobile; a escolhida é a única que bate a meta no desktop.

**Próximos passos:** pré-renderizar o HTML da Início e do Detalhe (SSG); separar o handshake do
MSW do primeiro render; reduzir a renderização abaixo da dobra.

## Limitações

- A API, o tempo real e a "rede" são simulados no navegador; dados ficam no `localStorage` do
  visitante (cada navegador tem seu próprio "servidor").
- Baselines visuais dependem do sistema operacional (sufixo `-win32`).
- Referências de transação e links de exploração são simulados.
