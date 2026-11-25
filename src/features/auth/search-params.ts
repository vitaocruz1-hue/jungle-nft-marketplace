import { z } from 'zod'

/** ?redirect=/pagamento&motivo=expirada — para onde voltar após entrar. */
export const authSearchSchema = z.object({
  redirect: z.string().optional().catch(undefined),
  motivo: z.enum(['expirada']).optional().catch(undefined),
})
