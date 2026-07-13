import { BASE_URL, API_TIMEOUT, AUTH_TOKEN_KEY } from '@env';

const PHARMYX_BASE_URL = 'https://pharmyx.etryx.in';

const asNumber = (value: unknown) => {
  const n = typeof value === 'string' ? Number(value) : Number(value);
  return Number.isFinite(n) ? n : undefined;
};

const resolveBaseUrl = (value: unknown) => {
  const normalized = String(value || '').trim().replace(/\/+$/, '');

  if (!normalized) {
    return PHARMYX_BASE_URL;
  }

  return normalized;
};

export const env = {
  BASE_URL: resolveBaseUrl(BASE_URL),
  API_TIMEOUT_MS: asNumber(API_TIMEOUT) ?? 30000,
  AUTH_TOKEN_KEY: String(AUTH_TOKEN_KEY).trim() || 'auth_token',
  RAZORPAY_KEY: 'rzp_test_placeholder', // Override later with real dot env
} as const;
