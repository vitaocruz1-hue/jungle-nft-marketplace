import axios from 'axios'

import { env } from '@/config/env'

/**
 * Cliente HTTP único do app. Toda chamada REST passa por aqui, então
 * tempo limite, cabeçalhos e (em breve) sessão e tratamento de erro
 * ficam centralizados em um só lugar.
 */
export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 10_000,
  headers: { Accept: 'application/json' },
})
