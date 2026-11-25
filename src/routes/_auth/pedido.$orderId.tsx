import { createFileRoute } from '@tanstack/react-router'

import { PagePlaceholder } from '@/components/page-placeholder'

export const Route = createFileRoute('/_auth/pedido/$orderId')({
  component: () => <PagePlaceholder title="Confirmação de pedido" />,
})
