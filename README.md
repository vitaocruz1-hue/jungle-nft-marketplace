# NFT Marketplace — Desafio Frontend

Solução do [desafio de frontend da Jungle Gaming](https://github.com/junglegaming/frontend-challenge):
um marketplace de NFTs em React + TypeScript com API e eventos em tempo real simulados no navegador.

> 🚧 Em desenvolvimento. Este README é atualizado a cada funcionalidade entregue.

## Requisitos

- Node.js 22 ou superior (desenvolvido com Node 24)
- npm 11 ou superior

## Como rodar

```powershell
npm install
npx playwright install chromium
npm run dev
```

Abra <http://localhost:5173>. A API simulada (MSW) já vem ligada; não é preciso nenhum backend.

## Comandos

| Comando                   | O que faz                                                     |
| ------------------------- | ------------------------------------------------------------- |
| `npm run dev`             | Servidor de desenvolvimento com mocks                         |
| `npm run build`           | Verifica os tipos e gera o build de produção em `dist/`       |
| `npm run preview`         | Serve o build de produção localmente                          |
| `npm run typecheck`       | Verificação de tipos (TypeScript)                             |
| `npm run lint`            | Análise estática (ESLint)                                     |
| `npm run format`          | Formata o código (Prettier)                                   |
| `npm run format:check`    | Confere a formatação sem alterar arquivos                     |
| `npm run test:e2e`        | Testes E2E (Playwright, desktop 1440 px e mobile 390 px)      |
| `npm run test:e2e:report` | Abre o relatório HTML do último teste (com traces das falhas) |

## Variáveis de ambiente

Nenhuma é obrigatória. Para mudar algum valor, copie `.env.example` para `.env.local`.

| Variável            | Padrão | Descrição                              |
| ------------------- | ------ | -------------------------------------- |
| `VITE_ENABLE_MOCKS` | `true` | Liga a API simulada (MSW) no navegador |
| `VITE_API_BASE_URL` | `/api` | Endereço base da API REST              |

## Stack

React 19, TypeScript 6, Vite 8, TanStack Router, TanStack Query, Axios, Socket.IO, Tailwind CSS 4,
shadcn/ui (sobre Radix UI), MSW 2, Playwright e Lighthouse.

Duas versões foram fixadas abaixo da mais recente por compatibilidade:

- **TypeScript 6.0**: o `typescript-eslint` ainda não suporta o TypeScript 7.
- **MSW 2**: o `@mswjs/socket.io-binding` (eventos Socket.IO simulados) ainda não suporta o MSW 3.

O `.npmrc` desativa scripts de instalação de dependências (`ignore-scripts=true`). Nenhum pacote
do projeto precisa deles; o worker do MSW (`public/mockServiceWorker.js`) é versionado e gerado
explicitamente com `npx msw init public`.

## Estrutura

```text
src/
├── components/      componentes visuais compartilhados
│   └── ui/          componentes shadcn/ui adaptados à identidade visual
├── config/          leitura das variáveis de ambiente
├── lib/             infraestrutura: cliente HTTP, cache, utilidades
├── mocks/           API simulada (MSW): handlers, dados e cenários
├── routes/          páginas (TanStack Router, uma rota por arquivo)
├── main.tsx         ponto de entrada: liga os mocks, o cache e o roteador
└── router.tsx       criação do roteador
e2e/                 testes Playwright
public/              arquivos estáticos (inclui o worker do MSW)
```
