import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
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

  const fetchServers = useCallback(async () => {
    setLoadingState({ status: 'loading' });
    try {
      const response = await serverApi.getServers();
      if (response.success && Array.isArray(response.servers)) {
        setLoadingState({ status: 'success', data: response.servers });
      } else {
        setLoadingState({ status: 'error', error: 'Ungültige Antwort vom Server.' });
      }
    } catch (err) {
      if (err instanceof ServerApiError) {
        if (err.statusCode === 503) {
          setLoadingState({ status: 'unavailable' });
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
  }, [fetchServers]);

  const servers = useMemo<DisplayServer[]>(() => {
    if (loadingState.status === 'success') {
      return loadingState.data.map(toDisplayServer);
    }
    return [];
  }, [loadingState]);

  // Auto-select first server when loaded
  useEffect(() => {
    if (servers.length > 0 && !selectedServerId) {
      setSelectedServerId(servers[0].id);
    }
  }, [servers, selectedServerId]);

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
    refresh: fetchServers,
  }), [servers, selectedServerId, selectedServer, selectServer, loadingState, fetchServers]);

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
