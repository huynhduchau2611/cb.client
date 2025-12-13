import { config } from '../config';

const API_ORIGIN = config.api.baseUrl.replace(/\/api\/?$/, '');

/**
 * Normalize avatar URL to absolute URL
 * @param url - Relative or absolute avatar URL
 * @returns Absolute URL or undefined if no URL provided
 */
export const normalizeAvatarUrl = (url?: string): string | undefined => {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) {
    return url; // Already absolute URL
  }
  // If starts with /uploads, use API origin without /api
  if (url.startsWith('/uploads')) {
    return `${API_ORIGIN}${url}`;
  }
  const normalizedPath = url.startsWith('/') ? url : `/${url}`;
  return `${API_ORIGIN}${normalizedPath}`;
};

