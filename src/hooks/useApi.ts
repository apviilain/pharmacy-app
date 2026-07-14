import { useCallback, useRef, useState } from 'react';

export const useApi = <TArgs extends unknown[], TResult>(
  request: (...args: TArgs) => Promise<TResult>,
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const mountedRef = useRef(true);

  const execute = useCallback(
    async (...args: TArgs) => {
      setLoading(true);
      setError(null);

      try {
        const result = await request(...args);
        if (mountedRef.current) {
          setLoading(false);
        }
        return result;
      } catch (nextError) {
        if (mountedRef.current) {
          setError(nextError);
          setLoading(false);
        }
        throw nextError;
      }
    },
    [request],
  );

  const reset = useCallback(() => {
    if (!mountedRef.current) return;
    setError(null);
    setLoading(false);
  }, []);

  const cleanup = useCallback(() => {
    mountedRef.current = false;
  }, []);

  return {
    execute,
    loading,
    error,
    reset,
    cleanup,
  };
};
