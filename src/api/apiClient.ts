import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios';

import { env } from '../config/env';
import { useAuthStore } from '../state/authStore';
import { handleApiResponse, maskToken, toApiError, ApiError } from './errorHandler';

const baseURL = env.BASE_URL;
if (!/^https:\/\//i.test(baseURL)) {
  // Fail fast to enforce HTTPS-only requirement.
  throw new Error('BASE_URL must use HTTPS (e.g., https://api.example.com)');
}

const timeout = env.API_TIMEOUT_MS;

type RetryableRequestConfig = AxiosRequestConfig & {
  __retryCount?: number;
  skipAuth?: boolean;
};

const createAxiosClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL,
    timeout,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  client.interceptors.response.use(response => handleApiResponse(response.data));

  return client;
};

// Used for calls that should not include Authorization (refresh, etc.)
export const publicApiClient = createAxiosClient();

export const apiClient: AxiosInstance = createAxiosClient();

// public client: map errors to ApiError (no auth attachment)
publicApiClient.interceptors.response.use(
  undefined,
  error => Promise.reject(toApiError(error))
);

const cleanPayload = (data: any): any => {
  if (!data || typeof data !== 'object' || data instanceof FormData) return data;
  const cleaned = { ...data };
  Object.keys(cleaned).forEach(key => {
    const val = cleaned[key];
    if (
      val === '' ||
      val === null ||
      val === undefined ||
      (Array.isArray(val) && val.length === 0)
    ) {
      delete cleaned[key];
    } else if (typeof val === 'object' && !Array.isArray(val)) {
      cleaned[key] = cleanPayload(val);
      if (Object.keys(cleaned[key]).length === 0) {
        delete cleaned[key];
      }
    }
  });
  return cleaned;
};

apiClient.interceptors.request.use((config: any) => {
  const cfg = config as RetryableRequestConfig;
  
  if (cfg.data && typeof cfg.data === 'object') {
    cfg.data = cleanPayload(cfg.data);
  }

  if (cfg.skipAuth) return cfg;

  const token = useAuthStore.getState().accessToken;
  if (token) {
    cfg.headers = cfg.headers ?? {};
    (cfg.headers as any).Authorization = `Bearer ${token}`;
  }

  // Development logging: never log tokens or sensitive payloads.
  if (__DEV__) {
    const method = (cfg.method || 'GET').toUpperCase();
    const url = `${cfg.baseURL ?? ''}${cfg.url ?? ''}`;
    const headers = cfg.headers as Record<string, any> | undefined;
    const safeHeaders = headers
      ? {
          ...headers,
          Authorization: maskToken(headers.Authorization),
        }
      : undefined;

    // eslint-disable-next-line no-console
    console.log('[API]', method, url, safeHeaders);
  }

  return cfg as any;
});

const delay = (ms: number) =>
  new Promise<void>(resolve => setTimeout(() => resolve(), ms));

apiClient.interceptors.response.use(
  // Success is handled in createAxiosClient's response interceptor
  undefined,
  async (error: AxiosError) => {
    const originalRequest = (error as any)?.config as RetryableRequestConfig | undefined;
    const apiError = error instanceof ApiError ? error : toApiError(error);

    // If we don't have request config, we can't retry/refresh.
    if (!originalRequest) throw apiError;

    // Pharmyx v1 currently provides OTP auth only; refresh can be added later.
    if (apiError.httpStatus === 401) {
      await useAuthStore.getState().logout();
      throw apiError;
    }

    // Optional retry: network errors and 5xx responses.
    const maxRetries = 1;
    const retryCount = originalRequest.__retryCount ?? 0;
    const shouldRetry =
      retryCount < maxRetries &&
      (apiError.httpStatus === undefined ||
        apiError.httpStatus >= 500 ||
        apiError.code === 'ECONNABORTED');

    if (shouldRetry) {
      originalRequest.__retryCount = retryCount + 1;
      const backoffMs = 300 * (retryCount + 1);
      await delay(backoffMs);
      return apiClient(originalRequest);
    }

    throw apiError;
  }
);
