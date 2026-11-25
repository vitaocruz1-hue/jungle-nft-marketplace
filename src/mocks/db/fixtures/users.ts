/**
 * Usuários fictícios. A senha de ambos é "Kurio@123" — guardada apenas como
 * hash SHA-256 de "sal:senha" (nunca em texto puro).
 */
export interface UserRecord {
  id: string
  username: string
  email: string
  displayName: string
  bio: string
  avatarUrl: string | null
  passwordSalt: string
  passwordHash: string
  createdAt: string
}

export function createUserFixtures(): UserRecord[] {
  return [
    {
      id: 'user-ana',
      username: 'ana.colecionadora',
      email: 'ana@kurio.dev',
      displayName: 'Ana Souza',
      bio: 'Colecionadora de arte generativa desde 2021.',
      avatarUrl: null,
      passwordSalt: 's4lt-ana-01',
      passwordHash: '6dc229f0d749cf0821133058b238256f86b536ef4b5c18a7e9a7efe59439dd0e',
      createdAt: '2026-01-10T12:00:00.000Z',
    },
    {
      id: 'user-bruno',
      username: 'bruno.nft',
      email: 'bruno@kurio.dev',
      displayName: 'Bruno Lima',
      bio: 'Fã de música on-chain.',
      avatarUrl: null,
      passwordSalt: 's4lt-bruno-02',
      passwordHash: '35bb74146abc4b980215fb9b943fc2a2db1d4b3a013b7022c717bdea45c4f2c2',
      createdAt: '2026-03-02T12:00:00.000Z',
    },
  ]
}
