# Auditoria Lighthouse

Gerado em 2026-11-26T17:39:30.507Z por `npm run audit` (configuração: `lighthouse/audit.config.mjs`).

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
| inicio | mobile | **62** ⚠️ | 100 | 96 | 100 | 5.84 s | 0.016 | 658 ms |
| inicio | desktop | 97 | 100 | 96 | 100 | 1.27 s | 0.002 | 16 ms |
| detalhe | mobile | **67** ⚠️ | 100 | 96 | 100 | 5.36 s | 0.000 | 410 ms |
| detalhe | desktop | 97 | 100 | 96 | 100 | 1.23 s | 0.001 | 6 ms |

Metas: Performance ≥ 90, Acessibilidade ≥ 95, Boas práticas ≥ 95, SEO ≥ 90. ⚠️ = abaixo da meta.

## Todas as execuções

- inicio · mobile: [61 / 100 / 96 / 100] [62 / 100 / 96 / 100] [62 / 100 / 96 / 100]
- inicio · desktop: [97 / 100 / 96 / 100] [97 / 100 / 96 / 100] [97 / 100 / 96 / 100]
- detalhe · mobile: [67 / 100 / 96 / 100] [69 / 100 / 96 / 100] [63 / 100 / 96 / 100]
- detalhe · desktop: [97 / 100 / 96 / 100] [97 / 100 / 96 / 100] [97 / 100 / 96 / 100]

Relatórios HTML/JSON (execução de performance mediana) nesta pasta: `<página>-<perfil>.report.html|json`.
