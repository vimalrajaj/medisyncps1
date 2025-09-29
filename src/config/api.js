const rawBaseUrl = import.meta.env?.VITE_API_BASE_URL?.trim();
const sanitizedBaseUrl = rawBaseUrl ? rawBaseUrl.replace(/\/+$/, '') : '';

export const API_BASE_URL = sanitizedBaseUrl;

export const resolveApiUrl = (path = '') => {
  if (!path) return API_BASE_URL || '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  if (!API_BASE_URL) {
    // Fall back to same-origin relative path when base URL is not configured
    return path.startsWith('/') ? path : `/${path}`;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

export const ensureApiBaseUrl = () => {
  if (!API_BASE_URL) {
    console.warn('VITE_API_BASE_URL is not set. Falling back to relative API paths.');
  }
  return API_BASE_URL;
};
