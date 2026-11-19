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
  const generationRef = useRef<number>(0);

  const fetchServers = useCallback(async (retryCount = 0, isManualRefresh = false) => {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(7);
    
    // Wenn manueller Refresh, erhöhen wir die Generation, um alle laufenden Retries/Anfragen ungültig zu machen.
    if (isManualRefresh || retryCount === 0) {
      generationRef.current++;
    }
    const currentGeneration = generationRef.current;
    
    console.log(`[ServerContext] [${requestId}] [G:${currentGeneration}] fetchServers ${isManualRefresh ? 'MANUAL ' : ''}start (retry: ${retryCount})`);

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
      console.log(`[ServerContext] [${requestId}] Aborting previous request`);
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Vorherige Timer löschen
    if (retryTimerRef.current) {
      console.log(`[ServerContext] [${requestId}] Clearing previous retry timer`);
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    try {
      console.log(`[ServerContext] [${requestId}] Sending GET /servers...`);
      const response = await serverApi.getServers({ signal: abortControllerRef.current.signal });
      const duration = Date.now() - startTime;
      
      // Generation Check
      if (currentGeneration !== generationRef.current) {
        console.log(`[ServerContext] [${requestId}] [G:${currentGeneration}] Stale response (latest generation is ${generationRef.current}), ignoring.`);
        return;
      }

      console.log(`[ServerContext] [${requestId}] [G:${currentGeneration}] Received response in ${duration}ms. Success: ${response.success}`);

      if (response.success && Array.isArray(response.servers)) {
        console.log(`[ServerContext] [${requestId}] Success! Found ${response.servers.length} servers.`);
        setLoadingState({ status: 'success', data: response.servers });
      } else {
        console.error(`[ServerContext] [${requestId}] Invalid response format`, response);
        setLoadingState({ status: 'error', error: 'Ungültige Antwort vom Server.' });
      }
    } catch (err: any) {
      const duration = Date.now() - startTime;

      // Generation Check (auch im Fehlerfall wichtig)
      if (currentGeneration !== generationRef.current) {
        console.log(`[ServerContext] [${requestId}] [G:${currentGeneration}] Stale error/abort (latest generation is ${generationRef.current}), ignoring.`);
        return;
      }

      if (err.name === 'AbortError') {
        console.log(`[ServerContext] [${requestId}] Request aborted after ${duration}ms`);
        return;
      }

      console.error(`[ServerContext] [${requestId}] Request failed after ${duration}ms:`, err);

      if (err instanceof ServerApiError) {
        console.log(`[ServerContext] [${requestId}] ServerApiError status: ${err.statusCode}`);
        if (err.statusCode === 503) {
          const maxRetries = 6;
          if (retryCount < maxRetries) {
            // Optimierte Retry-Strategie:
            // Versuch 0 -> 1: 500ms (schneller initialer Retry, da Snapshot oft in <400ms fertig)
            // Versuch 1 -> 2: 1000ms
            // Versuch 2 -> 3: 2000ms
            // ...
            const delay = Math.pow(2, retryCount - 1) * 1000 || 500;
            console.log(`[ServerContext] [${requestId}] 503 Service Unavailable. Retrying in ${delay}ms... (Attempt ${retryCount + 1}/${maxRetries})`);
            
            retryTimerRef.current = window.setTimeout(() => {
              console.log(`[ServerContext] [${requestId}] Retry timer fired. Starting next attempt.`);
              fetchServers(retryCount + 1);
            }, delay);
          } else {
            console.error(`[ServerContext] [${requestId}] Max retries reached.`);
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
    fetchServers(0, true);
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
