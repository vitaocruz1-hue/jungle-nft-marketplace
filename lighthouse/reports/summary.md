# Auditoria Lighthouse

Gerado em 2026-11-26T18:43:08.712Z por `npm run audit` (configuração: `lighthouse/audit.config.mjs`).

## Ambiente

- Lighthouse 13.6.0
- Navegador: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/159.0.0.0 Safari/537.36
- Node v24.18.0 · Windows_NT 10.0.26300 · AMD Ryzen 5 5500                               
- Build de produção (`vite build`) servido por `vite preview`; mocks (MSW) ligados no cenário padrão
- 3 execuções por página e perfil, cada uma em um Chrome com perfil limpo; valores = mediana
- Perfil mobile: configuração padrão do Lighthouse (Moto G Power emulado, 4G lento simulado, CPU 4x mais lenta)
- Perfil desktop: preset oficial `desktop-config` do Lighthouse

## Medianas

| Página | Perfil | Performance | Acessibilidade | Boas práticas | SEO | LCP | CLS | TBT |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| inicio | mobile | **71** ⚠️ | 100 | 96 | 100 | 5.48 s | 0.017 | 358 ms |
| inicio | desktop | 98 | 100 | 96 | 100 | 1.19 s | 0.002 | 0 ms |
| detalhe | mobile | **74** ⚠️ | 100 | 96 | 100 | 5.29 s | 0.000 | 229 ms |
| detalhe | desktop | 98 | 100 | 96 | 100 | 1.17 s | 0.001 | 0 ms |

Metas: Performance ≥ 90, Acessibilidade ≥ 95, Boas práticas ≥ 95, SEO ≥ 90. ⚠️ = abaixo da meta.

## Todas as execuções

- inicio · mobile: [71 / 100 / 96 / 100] [73 / 100 / 96 / 100] [71 / 100 / 96 / 100]
- inicio · desktop: [97 / 100 / 96 / 100] [98 / 100 / 96 / 100] [98 / 100 / 96 / 100]
- detalhe · mobile: [74 / 100 / 96 / 100] [74 / 100 / 96 / 100] [74 / 100 / 96 / 100]
- detalhe · desktop: [98 / 100 / 96 / 100] [98 / 100 / 96 / 100] [97 / 100 / 96 / 100]

Relatórios HTML/JSON (execução de performance mediana) nesta pasta: `<página>-<perfil>.report.html|json`.
