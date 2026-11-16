// Resolve API base URL with safe fallbacks:
// - Prefer explicit VITE_API_BASE_URL when provided
// - Otherwise use VITE_BACKEND_ORIGIN (local dev direct-to-backend)
// - Finally fall back to '/api' which is expected to be reverse-proxied to FastAPI in production
const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  (import.meta.env.VITE_BACKEND_ORIGIN as string | undefined) ||
  '/api';

const BACKEND_ORIGIN = (import.meta.env.VITE_BACKEND_ORIGIN as string | undefined) || '';

// Auth endpoints (/auth/*) must remain on /auth in production (reverse-proxied)
// and point to the backend origin in local development.
const AUTH_BASE_URL = BACKEND_ORIGIN || '';

function resolveBase(endpoint: string): string {
  // Route auth calls explicitly to AUTH base
  if (endpoint.startsWith('/auth/')) return AUTH_BASE_URL;
  // Everything else goes to API base (e.g. /api/support/*)
  return API_BASE_URL;
}

/**
 * Guard: endpoints passed to apiClient must NOT start with '/api/'
 * because API_BASE_URL already contains the '/api' prefix.
 * Auth endpoints ('/auth/...') are exempt as they use a different base.
 */
function assertNoDoubleApiPrefix(endpoint: string): void {
  if (import.meta.env.DEV && endpoint.startsWith('/api/')) {
    console.error(
      `[apiClient] Double /api prefix detected: endpoint "${endpoint}" should not start with "/api/" – ` +
      `the base URL already includes "/api". Remove the leading "/api" from the endpoint.`,
    );
  }
}

export const apiClient = {
  async get(endpoint: string) {
    assertNoDoubleApiPrefix(endpoint);
    const base = resolveBase(endpoint);
    const response = await fetch(`${base}${endpoint}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      },
    });
    return response;
  },

  async post(endpoint: string, data?: unknown) {
    assertNoDoubleApiPrefix(endpoint);
    const base = resolveBase(endpoint);
    const response = await fetch(`${base}${endpoint}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    return response;
  },

  async put(endpoint: string, data?: unknown) {
    assertNoDoubleApiPrefix(endpoint);
    const base = resolveBase(endpoint);
    const response = await fetch(`${base}${endpoint}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    return response;
  },

  async delete(endpoint: string) {
    assertNoDoubleApiPrefix(endpoint);
    const base = resolveBase(endpoint);
    const response = await fetch(`${base}${endpoint}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      },
    });
    return response;
  },

  getLoginUrl() {
    // In production/test the frontend and backend share the same origin
    // (Apache reverse-proxies /auth/* to the backend), so a relative path
    // works and keeps the cookie on the correct domain.
    // In local dev VITE_BACKEND_ORIGIN must point to the backend directly
    // (e.g. http://127.0.0.1:8000) because the Vite dev-server would
    // otherwise treat the path as an SPA route.
    // Use AUTH_BASE_URL to respect local dev vs prod behavior
    return `${AUTH_BASE_URL}/auth/discord/login`;
  },

  getBaseUrl() {
    return API_BASE_URL;
  }
};
