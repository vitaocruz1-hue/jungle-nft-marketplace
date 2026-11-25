import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Junta classes CSS e resolve conflitos do Tailwind.
 * Ex.: cn('p-2', condicao && 'p-4') → 'p-4' (a última vence, sem duplicar).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
