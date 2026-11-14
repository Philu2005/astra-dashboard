// --- Server-Typen basierend auf dem Astra Bot API-Vertrag ---

export interface ServerPermissions {
  administrator: boolean;
  manage_guild: boolean;
}

export interface AstraServer {
  id: string;
  name: string;
  icon: string | null;
  memberCount: number;
  owner: boolean;
  permissions: ServerPermissions;
}

export interface ServersResponse {
  success: true;
  count: number;
  servers: AstraServer[];
}

export interface ServerDetails {
  id: string;
  name: string;
  icon: string | null;
  memberCount: number;
  channelCount: number;
  roleCount: number;
  ownerId: string;
  permissions: ServerPermissions;
}

export interface ServerDetailsResponse {
  success: true;
  server: ServerDetails;
}

export interface ServerRole {
  id: string;
  name: string;
  color: number;
  position: number;
  permissions: string;
  managed: boolean;
  mentionable: boolean;
}

export interface ServerRolesResponse {
  success: true;
  roles: ServerRole[];
}

export type BotStatusValue = 'online' | 'offline' | 'connecting' | 'unknown';

export interface AstraStatusResponse {
  online: boolean;
  status?: BotStatusValue;
  last_heartbeat?: string | null;
  stale_after_seconds?: number | null;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
}

// --- Frontend-spezifische Zustände ---

export type ServerLoadingState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: AstraServer[] }
  | { status: 'error'; error: string; errorCode?: number }
  | { status: 'unavailable' };
