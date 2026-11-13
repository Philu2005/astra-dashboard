const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const BACKEND_ORIGIN = import.meta.env.VITE_BACKEND_ORIGIN || 'http://127.0.0.1:8000';

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
    // Login must go directly to the backend (not via Vite proxy) so that
    // the oauth_state cookie is set on 127.0.0.1 – the same origin that
    // Discord will call back to.
    return `${BACKEND_ORIGIN}/auth/discord/login`;
  },

  getBaseUrl() {
    return API_BASE_URL;
  }
};
