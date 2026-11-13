import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

// --- Types ---

export type AstraStatus = 'installed' | 'not_installed';
export type ServerRole = 'admin' | 'member';

export interface DiscordServer {
  id: string;
  name: string;
  icon: string | null;
  initials: string;
  memberCount: number;
  astraStatus: AstraStatus;
  role: ServerRole;
}

// --- Dummy Data ---

export const DUMMY_USERNAME = 'Philipp';

export const dummyServers: DiscordServer[] = [
  // Admin servers (8)
  { id: '1', name: 'Astra Community', icon: null, initials: 'AC', memberCount: 4821, astraStatus: 'installed', role: 'admin' },
  { id: '2', name: 'Gaming Lounge', icon: null, initials: 'GL', memberCount: 1253, astraStatus: 'installed', role: 'admin' },
  { id: '3', name: 'Creator Hub', icon: null, initials: 'CH', memberCount: 892, astraStatus: 'installed', role: 'admin' },
  { id: '4', name: 'Entwickler Treff', icon: null, initials: 'ET', memberCount: 347, astraStatus: 'not_installed', role: 'admin' },
  { id: '5', name: 'Musik & Chill', icon: null, initials: 'MC', memberCount: 2105, astraStatus: 'installed', role: 'admin' },
  { id: '6', name: 'Anime World', icon: null, initials: 'AW', memberCount: 568, astraStatus: 'not_installed', role: 'admin' },
  { id: '7', name: 'Studenten Café', icon: null, initials: 'SC', memberCount: 214, astraStatus: 'not_installed', role: 'admin' },
  { id: '8', name: 'Pixel Art Studio', icon: null, initials: 'PA', memberCount: 731, astraStatus: 'installed', role: 'admin' },
  // Member-only servers (3)
  { id: '9', name: 'Tech Talk DE', icon: null, initials: 'TT', memberCount: 1489, astraStatus: 'not_installed', role: 'member' },
  { id: '10', name: 'Roleplay Kingdom', icon: null, initials: 'RK', memberCount: 3042, astraStatus: 'installed', role: 'member' },
  { id: '11', name: 'Meme Factory', icon: null, initials: 'MF', memberCount: 8712, astraStatus: 'not_installed', role: 'member' },
];

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

// --- Context ---

interface ServerContextValue {
  servers: DiscordServer[];
  adminServers: DiscordServer[];
  memberServers: DiscordServer[];
  selectedServerId: string | null;
  selectedServer: DiscordServer | null;
  selectServer: (id: string) => void;
}

const ServerContext = createContext<ServerContextValue | null>(null);

export const ServerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedServerId, setSelectedServerId] = useState<string | null>(dummyServers[0].id);

  const adminServers = useMemo(() => dummyServers.filter((s) => s.role === 'admin'), []);
  const memberServers = useMemo(() => dummyServers.filter((s) => s.role === 'member'), []);

  const selectedServer = useMemo(
    () => adminServers.find((s) => s.id === selectedServerId) ?? null,
    [selectedServerId, adminServers]
  );

  const selectServer = useCallback((id: string) => {
    // Only allow selecting admin servers
    if (adminServers.some((s) => s.id === id)) {
      setSelectedServerId(id);
    }
  }, [adminServers]);

  const value = useMemo<ServerContextValue>(() => ({
    servers: dummyServers,
    adminServers,
    memberServers,
    selectedServerId,
    selectedServer,
    selectServer,
  }), [adminServers, memberServers, selectedServerId, selectedServer, selectServer]);

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
