import { BASE_URL, API_TIMEOUT, AUTH_TOKEN_KEY } from '@env';

const asNumber = (value: unknown) => {
  const n = typeof value === 'string' ? Number(value) : Number(value);
  return Number.isFinite(n) ? n : undefined;
};

export const env = {
  BASE_URL: String(BASE_URL).trim(),
  API_TIMEOUT_MS: asNumber(API_TIMEOUT) ?? 30000,
  AUTH_TOKEN_KEY: String(AUTH_TOKEN_KEY).trim() || 'auth_token',
  RAZORPAY_KEY: 'rzp_test_placeholder', // Override later with real dot env
} as const;

