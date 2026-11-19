import React, { createContext, useContext, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { serverApi, ServerApiError } from '@/services/server-api';
import type { AstraServer, ServerLoadingState } from '@/types/server';

// --- Display types used by UI components ---

export interface DisplayServer {
  id: string;
  name: string;
  icon: string | null;
  initials: string;
  memberCount: number;
  astraInstalled: boolean;
  owner: boolean;
}

export const iconColors = [
  'bg-[#4b46c8]',
  'bg-[#2d8c6f]',
  'bg-[#8b5cf6]',
  'bg-[#c2410c]',
  'bg-[#0e7490]',
  'bg-[#9333ea]',
  'bg-[#b45309]',
  'bg-[#6d28d9]',
  'bg-[#0369a1]',
  'bg-[#be185d]',
  'bg-[#4338ca]',
];

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');
}

function getDiscordIconUrl(guildId: string, iconHash: string): string {
  const ext = iconHash.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/icons/${guildId}/${iconHash}.${ext}`;
}

function toDisplayServer(server: AstraServer): DisplayServer {
  return {
    id: server.id,
    name: server.name,
    icon: server.icon ? getDiscordIconUrl(server.id, server.icon) : null,
    initials: getInitials(server.name),
    memberCount: server.memberCount,
    astraInstalled: true, // Alle Server von /api/servers haben Astra installiert
    owner: server.owner,
  };
}

// --- Context ---

interface ServerContextValue {
  servers: DisplayServer[];
  selectedServerId: string | null;
  selectedServer: DisplayServer | null;
  selectServer: (id: string) => void;
  loadingState: ServerLoadingState;
  refresh: () => void;
}

const ServerContext = createContext<ServerContextValue | null>(null);

export const ServerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState<ServerLoadingState>({ status: 'idle' });
  const retryTimerRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchServers = useCallback(async (retryCount = 0) => {
    // Wenn es der erste Versuch ist, setzen wir den Status auf 'loading'
    // Bei Retries behalten wir den Status bei oder könnten einen speziellen 'retrying' Status nutzen.
    // Hier nutzen wir 'loading', um dem User Feedback zu geben, dass etwas passiert.
    if (retryCount === 0) {
      setLoadingState({ status: 'loading' });
    } else {
      setLoadingState({ 
        status: 'loading', 
        message: `Synchronisierung läuft... (Versuch ${retryCount})` 
      });
    }

    // Vorherige Requests abbrechen
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Vorherige Timer löschen
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    try {
      const response = await serverApi.getServers({ signal: abortControllerRef.current.signal });
      if (response.success && Array.isArray(response.servers)) {
        setLoadingState({ status: 'success', data: response.servers });
      } else {
        setLoadingState({ status: 'error', error: 'Ungültige Antwort vom Server.' });
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;

      if (err instanceof ServerApiError) {
        if (err.statusCode === 503) {
          const maxRetries = 6;
          if (retryCount < maxRetries) {
            // Exponentielles Backoff: 1s, 2s, 4s, 8s, 16s, 32s
            const delay = Math.pow(2, retryCount) * 1000;
            
            // UI Update: Wir bleiben im 'loading' Zustand, 
            // könnten aber eine Info hinzufügen, dass wir warten.
            // Der Typ ServerLoadingState unterstützt das aktuell nicht direkt,
            // daher bleiben wir bei 'loading' für die UX-Konsistenz.
            
            retryTimerRef.current = window.setTimeout(() => {
              fetchServers(retryCount + 1);
            }, delay);
          } else {
            setLoadingState({ status: 'unavailable' });
          }
        } else {
          setLoadingState({ status: 'error', error: err.message, errorCode: err.statusCode });
        }
      } else {
        setLoadingState({ status: 'error', error: 'Verbindungsfehler beim Laden der Server.' });
      }
    }
  }, []);

  useEffect(() => {
    fetchServers();

    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [fetchServers]);

  const refresh = useCallback(() => {
    fetchServers(0);
  }, [fetchServers]);

  const servers = useMemo<DisplayServer[]>(() => {
    if (loadingState.status === 'success') {
      return loadingState.data.map(toDisplayServer);
    }
    return [];
  }, [loadingState]);

  // Entfernt: kein automatisches Auswählen des ersten Servers
  // Die Auswahl wird explizit durch Nutzeraktionen (z. B. Sidebar/Verwalten) gesetzt.

  // Route-basiertes Synchronisieren der aktiven Serverauswahl
  const location = useLocation();
  useEffect(() => {
    const path = location.pathname.replace(/\/+$/, '');
    const m = path.match(/^\/servers\/([^/]+)(?:\/.*)?$/);
    if (m && m[1]) {
      const id = decodeURIComponent(m[1]);
      if (servers.some((s) => s.id === id)) {
        setSelectedServerId(id);
        return;
      }
    }
    setSelectedServerId(null);
  }, [location.pathname, servers]);

  const selectedServer = useMemo(
    () => servers.find((s) => s.id === selectedServerId) ?? null,
    [selectedServerId, servers]
  );

  const selectServer = useCallback((id: string) => {
    if (servers.some((s) => s.id === id)) {
      setSelectedServerId(id);
    }
  }, [servers]);

  const value = useMemo<ServerContextValue>(() => ({
    servers,
    selectedServerId,
    selectedServer,
    selectServer,
    loadingState,
    refresh,
  }), [servers, selectedServerId, selectedServer, selectServer, loadingState, refresh]);

  return (
    <ServerContext.Provider value={value}>
      {children}
    </ServerContext.Provider>
  );
};

export function useServerContext(): ServerContextValue {
  const ctx = useContext(ServerContext);
  if (!ctx) {
    throw new Error('useServerContext must be used within a ServerProvider');
  }
  return ctx;
}
