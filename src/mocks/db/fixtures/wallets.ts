import type { UserWallets } from '../index'

/** Ana já tem uma carteira principal; Bruno começa sem carteiras. */
export function createWalletFixtures(): Record<string, UserWallets> {
  return {
    'user-ana': {
      primary: {
        id: 'wallet-ana-primary',
        slot: 'primary',
        displayName: 'Ana Souza',
        nickname: 'Cofre principal',
        network: 'ethereum',
        profileName: 'ana.colecionadora',
        address: '0x7a42c19e8b3d5f6a1c2e4b6d8f0a3c5e7b9d19e8',
        secondaryAddress: '',
        type: 'metamask',
        referralCode: 'KURIO2026',
        email: 'ana@kurio.dev',
        ensName: 'anasouza',
        updatedAt: '2026-01-10T12:00:00.000Z',
      },
      secondary: null,
    },
    'user-bruno': { primary: null, secondary: null },
  }
}
