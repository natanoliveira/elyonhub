'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { useState } from 'react'
import { ConfirmProvider } from '@/components/ui/confirm-dialog'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: 1 },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <ConfirmProvider>
        {children}
        <Toaster richColors position="top-right" />
      </ConfirmProvider>
    </QueryClientProvider>
  )
}
