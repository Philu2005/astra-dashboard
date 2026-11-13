import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AuthState } from '@/types/auth';
import { apiClient } from '@/lib/api-client';

const LOGIN_ERRORS: Record<string, string> = {
  access_denied: 'Die Discord-Autorisierung wurde abgebrochen.',
  invalid_state: 'Die Anmeldung konnte aus Sicherheitsgründen nicht bestätigt werden. Bitte versuche es erneut.',
  expired_state: 'Die Anmeldung ist abgelaufen. Bitte starte den Login erneut.',
  missing_code: 'Discord hat keinen gültigen Anmeldecode zurückgegeben.',
  token_exchange_failed: 'Die Anmeldung bei Discord konnte nicht abgeschlossen werden.',
  user_fetch_failed: 'Dein Discord-Profil konnte nicht geladen werden.',
};

interface AuthContextType extends AuthState {
  login: () => void;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  status: 'loading' | 'authenticated' | 'unauthenticated' | 'error';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Check if the current path is part of the OAuth callback flow.
 * During callback processing, automatic session checks must be suppressed.
 */
function isCallbackPath(): boolean {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  return path === '/auth/callback';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    authenticated: false,
    user: null,
    loading: true,
    error: null,
  });

  const checkSession = useCallback(async () => {
    // Don't check session during callback exchange – it would get 401 and
    // overwrite the state that the exchange is about to set.
    if (isCallbackPath()) {
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));

    try {
      const response = await apiClient.get('/auth/me');
      if (response.ok) {
        const data = await response.json();
        setState({
          authenticated: true,
          user: data.user,
          loading: false,
          error: null,
        });
      } else if (response.status === 401) {
        // 401 before login is normal – not an error
        setState((prev) => ({
          ...prev,
          authenticated: false,
          user: null,
          loading: false,
          error: prev.error, // preserve any existing error (e.g. from URL params)
        }));
      } else {
        setState((prev) => ({
          ...prev,
          authenticated: false,
          user: null,
          loading: false,
          error: 'Sitzung konnte nicht überprüft werden',
        }));
      }
    } catch (err) {
      console.error('Failed to check session:', err);
      // Network/CORS errors are NOT a logout – keep previous auth state if any
      setState((prev) => ({
        ...prev,
        loading: false,
        error: prev.authenticated ? prev.error : 'Backend-Verbindung fehlgeschlagen',
      }));
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = () => {
    window.location.href = apiClient.getLoginUrl();
  };

  const logout = async () => {
    try {
      const response = await apiClient.post('/auth/logout');
      if (!response.ok && response.status !== 401) {
        throw new Error(`Logout failed: ${response.status}`);
      }

      setState({
        authenticated: false,
        user: null,
        loading: false,
        error: null,
      });
      window.location.href = '/';
    } catch (err) {
      console.error('Logout failed:', err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: 'Abmeldung fehlgeschlagen. Bitte erneut versuchen.',
      }));
    }
  };

  // Parse error from URL query params (e.g. after failed OAuth callback)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorCode = params.get('error');

    if (!errorCode) {
      return;
    }

    const mappedError = LOGIN_ERRORS[errorCode] ?? 'Bei der Anmeldung ist ein unbekannter Fehler aufgetreten.';
    setState((prev) => ({ ...prev, error: mappedError, loading: false }));
  }, []);

  const status: AuthContextType['status'] = state.loading
    ? 'loading'
    : state.error && !state.authenticated
      ? 'error'
      : state.authenticated
        ? 'authenticated'
        : 'unauthenticated';

  return (
    <AuthContext.Provider value={{ ...state, login, logout, checkSession, status }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
