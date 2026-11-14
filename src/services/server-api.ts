import { apiClient } from '@/lib/api-client';
import type {
  ServersResponse,
  ServerDetailsResponse,
  ServerRolesResponse,
  AstraStatusResponse,
} from '@/types/server';

export class ServerApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'ServerApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    throw new ServerApiError('Sitzung abgelaufen. Bitte erneut anmelden.', 401);
  }

  if (response.status === 503) {
    throw new ServerApiError('Astra ist derzeit nicht erreichbar.', 503);
  }

  if (!response.ok) {
    let message = 'Ein unerwarteter Fehler ist aufgetreten.';
    try {
      const body = await response.json();
      if (body?.detail) {
        message = body.detail;
      }
    } catch {
      // JSON-Parsing fehlgeschlagen – Standardnachricht verwenden
    }
    throw new ServerApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}

export const serverApi = {
  async getServers(): Promise<ServersResponse> {
    const res = await apiClient.get('/api/servers');
    return handleResponse<ServersResponse>(res);
  },

  async getServer(guildId: string): Promise<ServerDetailsResponse> {
    const res = await apiClient.get(`/api/servers/${guildId}`);
    return handleResponse<ServerDetailsResponse>(res);
  },

  async getServerRoles(guildId: string): Promise<ServerRolesResponse> {
    const res = await apiClient.get(`/api/servers/${guildId}/roles`);
    return handleResponse<ServerRolesResponse>(res);
  },

  async getAstraStatus(): Promise<AstraStatusResponse> {
    const res = await apiClient.get('/api/status');
    return handleResponse<AstraStatusResponse>(res);
  },
};
