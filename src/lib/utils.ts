/**
 * Junta classes CSS e resolve conflitos do Tailwind.
 * Ex.: cn('p-2', condicao && 'p-4') → 'p-4' (a última vence, sem duplicar).
 *
 * Vem do pacote oficial `cn` (do autor do shadcn/ui), o mesmo que os
 * componentes em src/components/ui usam.
 */
export { cn } from 'cn'
