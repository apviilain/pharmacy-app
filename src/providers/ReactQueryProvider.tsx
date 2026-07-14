import React, { useState } from 'react';
import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
  QueryCache,
  onlineManager,
} from '@tanstack/react-query';

import type { ApiError } from '../api/errorHandler';
import { useNetworkStore } from '../network/networkStore';
import { logger } from '../utils/logger';

const createQueryClient = () =>
  new QueryClient({
    queryCache: new QueryCache({
      onError: (error: unknown) => {
        const apiError = error as Partial<ApiError>;
        logger.error('React Query request error', {
          message: apiError?.message,
          userMessage: apiError?.userMessage,
          status: apiError?.httpStatus,
        });
      },
    }),
    mutationCache: new MutationCache({
      onError: (error: unknown) => {
        const apiError = error as Partial<ApiError>;
        logger.error('React Query mutation error', {
          message: apiError?.message,
          userMessage: apiError?.userMessage,
          status: apiError?.httpStatus,
        });
      },
    }),
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
  const isConnected = useNetworkStore(state => state.isConnected);
  const isInternetReachable = useNetworkStore(state => state.isInternetReachable);

  React.useEffect(() => {
    onlineManager.setOnline(isConnected && isInternetReachable);
  }, [isConnected, isInternetReachable]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
