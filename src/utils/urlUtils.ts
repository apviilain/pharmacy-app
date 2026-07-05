import { env } from '../config/env';

/**
 * Builds a full URL from a relative path using the BASE_URL.
 * Handles trailing/leading slashes correctly and encodes the URI.
 */
export const buildFullUrl = (path: string | undefined | null): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  
  const baseUrl = env.BASE_URL;
  const base = baseUrl?.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return encodeURI(`${base}${cleanPath}`);
};
