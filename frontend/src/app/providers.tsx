'use client';

import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * React Query provider (2026-08-30).
 * Server-state layer for dashboard pages: caching, dedup, retries,
 * background polling. Defaults tuned for this app's usage pattern:
 *   - staleTime 10s → switching tabs/pages doesn't re-fetch everything
 *   - retry 1 → single retry on failure (backend down = show error fast)
 *   - refetchOnWindowFocus off → polling pages own their cadence
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}