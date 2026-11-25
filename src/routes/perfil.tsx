import { createFileRoute } from '@tanstack/react-router'

import { PagePlaceholder } from '@/components/page-placeholder'

export const Route = createFileRoute('/perfil')({
  component: () => <PagePlaceholder title="Perfil do colecionador" />,
})
