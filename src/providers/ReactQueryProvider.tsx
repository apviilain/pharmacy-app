import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { ApiError } from '../api/errorHandler';

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error: unknown) => {
          const apiError = error as Partial<ApiError>;

          if (failureCount >= 2) return false;

          // Retry only when it looks safe: network/timeouts or server errors.
          const httpStatus = apiError.httpStatus;
          if (!httpStatus) return true;
          if (httpStatus >= 500) return true;
          return false;
        },
        retryDelay: attemptIndex => Math.min(1000 * (attemptIndex + 1), 3000),
      },
      mutations: {
        retry: false,
      },
    },
  });

export const ReactQueryProvider = ({ children }: { children: React.ReactNode }) => {
  // Ensure we don't recreate the client on every render.
  const [queryClient] = useState(createQueryClient);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

