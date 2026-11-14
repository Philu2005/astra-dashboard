const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const BACKEND_ORIGIN = import.meta.env.VITE_BACKEND_ORIGIN || '';

export const apiClient = {
  async get(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      },
    });
    return response;
  },

  async post(endpoint: string, data?: unknown) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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

  getLoginUrl() {
    // In production/test the frontend and backend share the same origin
    // (Apache reverse-proxies /auth/* to the backend), so a relative path
    // works and keeps the cookie on the correct domain.
    // In local dev VITE_BACKEND_ORIGIN must point to the backend directly
    // (e.g. http://127.0.0.1:8000) because the Vite dev-server would
    // otherwise treat the path as an SPA route.
    return `${BACKEND_ORIGIN}/auth/discord/login`;
  },

  getBaseUrl() {
    return API_BASE_URL;
  }
};
