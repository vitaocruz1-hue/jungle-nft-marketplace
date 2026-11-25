# Auditoria Lighthouse

Gerado em 2026-11-25T17:51:22.889Z por `npm run audit` (configuração: `lighthouse/audit.config.mjs`).

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
| inicio | mobile | **67** ⚠️ | 100 | 96 | 100 | 5.59 s | 0.000 | 501 ms |
| inicio | desktop | 97 | 100 | 96 | 100 | 1.28 s | 0.002 | 7 ms |
| detalhe | mobile | **66** ⚠️ | 100 | 96 | 100 | 5.30 s | 0.000 | 580 ms |
| detalhe | desktop | 98 | 100 | 96 | 100 | 1.14 s | 0.000 | 3 ms |

Metas: Performance ≥ 90, Acessibilidade ≥ 95, Boas práticas ≥ 95, SEO ≥ 90. ⚠️ = abaixo da meta.

## Todas as execuções

- inicio · mobile: [67 / 100 / 96 / 100] [68 / 100 / 96 / 100] [63 / 100 / 96 / 100]
- inicio · desktop: [97 / 100 / 96 / 100] [97 / 100 / 96 / 100] [97 / 100 / 96 / 100]
- detalhe · mobile: [67 / 100 / 96 / 100] [65 / 100 / 96 / 100] [66 / 100 / 96 / 100]
- detalhe · desktop: [98 / 100 / 96 / 100] [98 / 100 / 96 / 100] [98 / 100 / 96 / 100]

Relatórios HTML/JSON (execução de performance mediana) nesta pasta: `<página>-<perfil>.report.html|json`.
