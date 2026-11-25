import { toast } from 'sonner'

/** Avisa, sem fingir sucesso, que a seção não faz parte desta demonstração. */
export function notifyComingSoon(section: string) {
  toast.info(`${section}: em breve`, {
    description: 'Esta seção não está disponível nesta demonstração.',
  })
}
