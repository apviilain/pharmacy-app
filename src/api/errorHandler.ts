import type { AxiosError } from 'axios';
import { getHttpErrorMessage } from '../error/errorMessages';

export type ApiEnvelope<T = any> = {
  success: boolean;
  message: string;
  data: T;
};

export class ApiError extends Error {
  public httpStatus?: number;
  public code?: string;
  public userMessage: string;
  public details?: unknown;

  constructor(params: {
    message: string;
    userMessage: string;
    httpStatus?: number;
    code?: string;
    details?: unknown;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.httpStatus = params.httpStatus;
    this.code = params.code;
    this.userMessage = params.userMessage;
    this.details = params.details;
  }
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);

const isApiEnvelope = (v: unknown): v is ApiEnvelope => {
  if (!isRecord(v)) return false;
  return 'success' in v && 'data' in v;
};

/**
 * Standardizes backend responses that follow:
 * { success: boolean, message: string, data: any }
 *
 * - Returns `data` when `success=true`
 * - Throws `ApiError` when `success=false`
 */
export const handleApiResponse = <T,>(payload: unknown): T => {
  if (isRecord(payload) && payload.error && typeof payload.message === 'string') {
    throw new ApiError({
      message: payload.message,
      userMessage: payload.message,
      code: typeof payload.code === 'string' ? payload.code : undefined,
      details: payload,
    });
  }

  if (!isApiEnvelope(payload)) return payload as T;

  if (payload.success) {
    return payload.data as T;
  }

  const message =
    typeof payload.message === 'string' && payload.message.trim().length > 0
      ? payload.message
      : 'Request failed';

  throw new ApiError({
    message,
    userMessage: message,
    details: payload,
  });
};

export const maskToken = (token: string | undefined | null) => {
  if (!token) return undefined;
  if (token.length <= 12) return '***';
  return `${token.slice(0, 6)}...${token.slice(-4)}`;
};

export const toApiError = (error: unknown): ApiError => {
  const axiosError = error as AxiosError<any>;

  const httpStatus = axiosError?.response?.status;
  const code = axiosError?.code;
  const originalMessage = axiosError?.message ?? 'Request failed';

  const payload = axiosError?.response?.data;
  const serverMessage =
    isRecord(payload) && typeof payload.message === 'string'
      ? payload.message
      : undefined;

  const isTimeout =
    code === 'ECONNABORTED' || /timeout/i.test(originalMessage || '');

  const userMessage = (() => {
    if (httpStatus === 401) return getHttpErrorMessage(401);
    if (httpStatus === 403) return getHttpErrorMessage(403);
    if (isTimeout) return getHttpErrorMessage(408);
    if (!httpStatus) return 'No internet connection. Please try again.'; // network error / offline
    if (httpStatus >= 500) return getHttpErrorMessage(httpStatus);
    if (httpStatus >= 400 && httpStatus < 500) {
      return serverMessage || getHttpErrorMessage(httpStatus);
    }
    return serverMessage || originalMessage || getHttpErrorMessage(httpStatus);
  })();

  return new ApiError({
    message: serverMessage || originalMessage,
    userMessage,
    httpStatus,
    code,
    details: payload,
  });
};
