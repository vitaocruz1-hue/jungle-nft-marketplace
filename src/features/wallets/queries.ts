import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type {
  Wallet,
  WalletConnection,
  WalletInput,
  WalletSlot,
  WalletsResponse,
} from '@/contracts/wallets'
import { privateKeys, useSession } from '@/features/auth/session'
import { apiClient } from '@/lib/api-client'

async function getWallets(signal?: AbortSignal) {
  const { data } = await apiClient.get<WalletsResponse>('/wallets', { signal })
  return data
}

async function saveWallet(slot: WalletSlot, input: WalletInput) {
  const { data } = await apiClient.put<Wallet>(`/wallets/${slot}`, input)
  return data
}

export async function connectWallet(walletId: string) {
  const { data } = await apiClient.post<WalletConnection>(
    `/wallets/${encodeURIComponent(walletId)}/connect`,
  )
  return data
}

const walletsKey = (userId: string) => [...privateKeys.user(userId), 'wallets'] as const

export function walletsQueryOptions(userId: string) {
  return queryOptions({
    queryKey: walletsKey(userId),
    queryFn: ({ signal }) => getWallets(signal),
  })
}

export function useWallets() {
  const { user } = useSession()
  return useQuery({ ...walletsQueryOptions(user?.id ?? ''), enabled: user !== null })
}

export function useSaveWallet() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  return useMutation({
    mutationFn: ({ slot, input }: { slot: WalletSlot; input: WalletInput }) =>
      saveWallet(slot, input),
    onSuccess: (wallet) => {
      if (!user) return
      queryClient.setQueryData<WalletsResponse>(walletsKey(user.id), (old) => ({
        primary: old?.primary ?? null,
        secondary: old?.secondary ?? null,
        [wallet.slot]: wallet,
      }))
    },
  })
}
