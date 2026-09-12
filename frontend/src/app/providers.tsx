'use client'

import React, { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { registerServiceWorker } from '@/lib/offline/register-sw'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  useEffect(() => {
    registerServiceWorker()
  }, [])

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

