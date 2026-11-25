# Kurio — Marketplace de NFTs

Solução do [desafio de frontend da Jungle Gaming](https://github.com/junglegaming/frontend-challenge):
marketplace de NFTs em React + TypeScript, fiel ao Figma, com API REST e eventos em tempo real
**simulados no navegador** (MSW + Socket.IO). Não há backend: tudo roda a partir de um checkout limpo.

- **Aplicação publicada:** <https://jungle-nft-marketplace-jade.vercel.app/>
- **Repositório:** <https://github.com/vitaocruz1-hue/jungle-nft-marketplace>
- **Arquitetura, contratos e decisões:** [ARCHITECTURE.md](ARCHITECTURE.md)
- **Auditoria Lighthouse:** [lighthouse/reports/summary.md](lighthouse/reports/summary.md)

## Requisitos

- Node.js 22 ou superior (desenvolvido com Node 24) e npm 11 ou superior

## Como rodar

```powershell
npm install
npx playwright install chromium
npm run dev
```

Abra <http://localhost:5173>. A API simulada (MSW) já vem ligada.

> O `.npmrc` desativa scripts de instalação de dependências (`ignore-scripts=true`): nenhuma
> precisa deles. O worker do MSW (`public/mockServiceWorker.js`) é versionado.

## Comandos

| Comando                      | O que faz                                                                |
| ---------------------------- | ------------------------------------------------------------------------ |
| `npm run dev`                | Desenvolvimento com mocks                                                |
| `npm run build`              | Verifica tipos e gera o build de produção em `dist/`                     |
| `npm run preview`            | Serve o build de produção (mocks ligados)                                |
| `npm run typecheck`          | Verificação de tipos                                                     |
| `npm run lint`               | ESLint (inclui regras que proíbem `fetch` e importar `src/mocks` no app) |
| `npm run format:check`       | Confere a formatação (Prettier)                                          |
| `npm run test:e2e`           | Testes E2E (Playwright, Chromium, desktop 1440 px e mobile 390 px)       |
| `npm run test:visual`        | Regressão visual de início, detalhe, carrinho e pagamento                |
| `npm run test:visual:update` | Regenera as baselines visuais                                            |
| `npm run test:e2e:report`    | Abre o relatório HTML do último teste (com traces das falhas)            |
| `npm run audit`              | Build + auditoria Lighthouse (3 execuções por página/perfil, medianas)   |

Os testes sobem o próprio servidor (build de produção na porta 4180); não é preciso rodar o app antes.

## Variáveis de ambiente

Nenhuma é obrigatória. Para mudar algum valor, copie `.env.example` para `.env.local`.

| Variável            | Padrão | Descrição                                                |
| ------------------- | ------ | -------------------------------------------------------- |
| `VITE_ENABLE_MOCKS` | `true` | Liga a API simulada (MSW) — inclusive no build de deploy |
| `VITE_API_BASE_URL` | `/api` | Endereço base da API REST                                |

## Credenciais fictícias

| Usuário | E-mail            | Senha       | Situação inicial                                       |
| ------- | ----------------- | ----------- | ------------------------------------------------------ |
| Ana     | `ana@kurio.dev`   | `Kurio@123` | Carteira principal cadastrada; 1 favorito              |
| Bruno   | `bruno@kurio.dev` | `Kurio@123` | Sem carteiras (bom para testar o cadastro de carteira) |

Cupons: `KURIO10` (10%), `GENESIS5` (5%), `EXPIRADO` (vencido). Qualquer outro código é inválido.

## Cenários da simulação

Escolha um cenário pela URL (`?cenario=<id>`) ou pelo **painel "Cenários"** no canto inferior
esquerdo da tela. A escolha vale para a aba atual até ser trocada (`?cenario=padrao` volta ao normal).

| Cenário              | O que acontece                                                              |
| -------------------- | --------------------------------------------------------------------------- |
| `padrao`             | Rede normal (~250 ms por resposta)                                          |
| `lento`              | 3 s por resposta (skeletons)                                                |
| `variavel`           | Latências fixas e diferentes por requisição (respostas fora de ordem)       |
| `instavel`           | As 2 primeiras consultas falham (503) e as repetições automáticas recuperam |
| `erro-servidor`      | O catálogo responde 500 (feedback de erro e "Tentar novamente")             |
| `offline`            | Toda chamada falha por rede e o socket é recusado                           |
| `falha-favoritos`    | Favoritar/desfavoritar responde 503 (rollback da atualização otimista)      |
| `carteira-recusa`    | O usuário recusa a conexão da carteira no pagamento                         |
| `pagamento-recusado` | O pedido é criado e depois recusado pela "rede"                             |
| `timeout-pedido`     | O pedido é criado, mas a resposta chega após o timeout do cliente           |

**Reset:** painel → "Restaurar dados iniciais" (restaura catálogo, usuários, carrinhos, carteiras e
pedidos, e encerra a sessão). Os dados simulados ficam no `localStorage` para sobreviver ao F5.

O painel também dispara eventos Socket.IO pelo "servidor" simulado: alterar preço, esgotar edições,
reenviar o último evento (duplicata), enviar uma versão antiga e derrubar a conexão. Em testes, os
mesmos controles estão em `window.__kurioMocks`.

## Como reproduzir os fluxos de falha

| Fluxo                                             | Passos                                                                                                                                                            |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resultado vazio                                   | Busque por `xyz` (lupa no cabeçalho)                                                                                                                              |
| Respostas fora de ordem                           | `?cenario=variavel` e troque filtros rapidamente: a lista sempre corresponde ao último filtro                                                                     |
| Falha HTTP 5xx e recuperação                      | `?cenario=erro-servidor` → "Tentar novamente" após voltar para `padrao` no painel                                                                                 |
| Sem conexão                                       | `?cenario=offline`                                                                                                                                                |
| Sessão expirada                                   | Entre como Ana → painel "Expirar sessão atual" → qualquer ação: aviso e volta ao login guardando a página                                                         |
| Acesso não autorizado                             | Sem login, abra `/perfil`, `/carteiras` ou `/pagamento`                                                                                                           |
| Conflito de cadastro                              | Crie conta com `ana@kurio.dev`                                                                                                                                    |
| Validação de formulário                           | Envie cadastro, perfil, senha ou carteira com campos vazios/inválidos                                                                                             |
| Cupom inválido/expirado                           | No carrinho, aplique `NAOEXISTE` ou `EXPIRADO`                                                                                                                    |
| Preço alterado / edição esgotada durante a compra | Entre como Ana, adicione `Emerald Ape #042`, vá até "Revise seu pedido" e, no painel, altere o preço ou esgote o NFT: a confirmação trava até "Atualizar cotação" |
| Timeout com recuperação                           | `?cenario=timeout-pedido` → confirme a compra: após ~10 s a nova tentativa usa a mesma chave e recupera o mesmo pedido                                            |
| Clique repetido                                   | Clique duas vezes em "Confirmar compra": um único pedido                                                                                                          |
| Pagamento recusado                                | `?cenario=pagamento-recusado` → itens continuam no carrinho                                                                                                       |
| Pedido pendente + F5/reconexão                    | Confirme a compra e recarregue durante "Processando": o mesmo pedido é retomado e confirmado                                                                      |
| Eventos duplicados/antigos                        | Painel → "Reenviar último evento" / "Enviar versão antiga": nada regride                                                                                          |

## Testes

- **E2E** (`npm run test:e2e`): 40 cenários × desktop e mobile, cobrindo os 12 itens do enunciado
  (catálogo, detalhe, conta, favoritos, carrinho, compra, falhas, perfil/carteiras, tempo real,
  eventos duplicados/desconexão, teclado/foco e skeletons/recuperação). Cada teste roda em um
  contexto isolado (armazenamento limpo); tempo real passa pelo `socket.io-client` e REST pelos
  handlers MSW.
- **Regressão visual** (`npm run test:visual`): baselines em `e2e/visual.spec.ts-snapshots/`. Como a
  renderização de fontes muda por sistema operacional, as baselines têm sufixo de plataforma
  (`-win32`, geradas no Windows). Em outro sistema, gere as suas com `npm run test:visual:update`.
- Relatório HTML em `playwright-report/` e traces das falhas em `test-results/`.

## Auditoria Lighthouse

`npm run audit` — configuração em [lighthouse/audit.config.mjs](lighthouse/audit.config.mjs),
relatórios e ambiente em [lighthouse/reports/](lighthouse/reports/summary.md).

| Página  | Perfil  | Performance | Acessibilidade | Boas práticas | SEO |    LCP |   CLS |    TBT |
| ------- | ------- | ----------: | -------------: | ------------: | --: | -----: | ----: | -----: |
| Início  | mobile  |          67 |            100 |            96 | 100 | 5,59 s | 0,000 | 501 ms |
| Início  | desktop |          97 |            100 |            96 | 100 | 1,28 s | 0,002 |   7 ms |
| Detalhe | mobile  |          66 |            100 |            96 | 100 | 5,30 s | 0,000 | 580 ms |
| Detalhe | desktop |          98 |            100 |            96 | 100 | 1,14 s | 0,000 |   3 ms |

Performance mobile fica abaixo de 90; causas e tentativas em
[ARCHITECTURE.md → Performance](ARCHITECTURE.md#performance).

## Deploy

Configurado para a Vercel (`vercel.json`: build do Vite, reescrita de rotas para a SPA e cache dos
assets). Importe o repositório na Vercel; nenhuma variável é necessária (os mocks ficam ligados).

## Estrutura

```text
src/
├── contracts/   tipos e regras compartilhados entre app e API simulada (REST e eventos)
├── routes/      telas (TanStack Router, uma rota por arquivo; _auth = rotas privadas)
├── features/    lógica por domínio: catalog, cart, auth, favorites, checkout, orders, wallets, realtime…
├── components/  componentes compartilhados (layout, formulários) e ui/ (shadcn/ui)
├── lib/         cliente Axios, erros, cache, ETH em BigInt, sessão
├── mocks/       API simulada: handlers MSW, Socket.IO, banco, cenários, painel
├── app.tsx      cache + roteador
└── main.tsx     inicia os mocks e o app
e2e/             testes Playwright (fluxos e regressão visual)
lighthouse/      configuração, script e relatórios da auditoria
```
