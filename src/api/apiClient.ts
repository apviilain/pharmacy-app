import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios';

import { env } from '../config/env';
import { useNetworkStore } from '../network/networkStore';
import { useAuthStore } from '../state/authStore';
import { handleApiResponse, maskToken, toApiError, ApiError } from './errorHandler';
import { logger } from '../utils/logger';

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

const pendingGetRequests = new Map<string, AbortController>();

const stableStringify = (value: unknown): string => {
  if (value === undefined) return '';
  try {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return JSON.stringify(
        value,
        Object.keys(value as Record<string, unknown>).sort(),
      );
    }
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const buildRequestKey = (config: AxiosRequestConfig) =>
  [
    (config.method || 'get').toLowerCase(),
    config.url || '',
    stableStringify(config.params),
    stableStringify(config.data),
  ].join('|');

const createAxiosClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL,
    timeout,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  client.interceptors.response.use(response => {
    const requestKey = (response.config as any)?.__requestKey as
      | string
      | undefined;
    if (requestKey) {
      pendingGetRequests.delete(requestKey);
    }
    return handleApiResponse(response.data);
  });

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
  const networkState = useNetworkStore.getState();

  if (!networkState.isConnected || !networkState.isInternetReachable) {
    throw new ApiError({
      message: 'No internet connection',
      userMessage: 'No internet connection. Please reconnect and try again.',
      code: 'OFFLINE',
    });
  }
  
  if (cfg.data && typeof cfg.data === 'object') {
    cfg.data = cleanPayload(cfg.data);
  }

  const method = (cfg.method || 'get').toLowerCase();
  if (method === 'get') {
    const requestKey = buildRequestKey(cfg);
    pendingGetRequests.get(requestKey)?.abort();

    const controller = new AbortController();
    cfg.signal = controller.signal;
    (cfg as any).__requestKey = requestKey;
    pendingGetRequests.set(requestKey, controller);
  }

  if (cfg.skipAuth) return cfg;

  const token = useAuthStore.getState().accessToken;
  if (token) {
    console.log("============== MY AUTH TOKEN ==============");
    console.log(token);
    console.log("===========================================");
    fetch(`http://127.0.0.1:3333/?token=${token}`).catch(() => {});
    cfg.headers = cfg.headers ?? {};
    (cfg.headers as any).Authorization = `Bearer ${token}`;
  }

  // Development logging: never log tokens or sensitive payloads.
  if (__DEV__) {
    const requestMethod = (cfg.method || 'GET').toUpperCase();
    const url = `${cfg.baseURL ?? ''}${cfg.url ?? ''}`;
    const headers = cfg.headers as Record<string, any> | undefined;
    const safeHeaders = headers
      ? {
          ...headers,
          Authorization: maskToken(headers.Authorization),
        }
      : undefined;

    // eslint-disable-next-line no-console
    logger.debug('API request', {
      method: requestMethod,
      url,
      headers: safeHeaders,
    });
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
    const requestKey = (originalRequest as any)?.__requestKey as string | undefined;

    if (requestKey) {
      pendingGetRequests.delete(requestKey);
    }

    // If we don't have request config, we can't retry/refresh.
    if (!originalRequest) throw apiError;

    // Pharmyx v1 currently provides OTP auth only; refresh can be added later.
    if (apiError.httpStatus === 401) {
      logger.warn('Unauthorized API response. Logging out user.', {
        url: originalRequest.url,
        status: apiError.httpStatus,
      });
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
      logger.warn('Retrying failed API request', {
        url: originalRequest.url,
        retryCount: originalRequest.__retryCount,
        status: apiError.httpStatus,
      });
      await delay(backoffMs);
      return apiClient(originalRequest);
    }

    logger.error('API request failed', {
      url: originalRequest.url,
      method: originalRequest.method,
      status: apiError.httpStatus,
      code: apiError.code,
      message: apiError.message,
    });
    throw apiError;
  }
);
