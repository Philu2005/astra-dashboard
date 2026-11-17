import { apiClient } from '@/lib/api-client';
import type { AutomodConfig, AutomodResponse, ModlogResponse, WarnsResponse } from '@/types/moderation';

class ModerationApiError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = 'ModerationApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) throw new ModerationApiError('Sitzung abgelaufen. Bitte erneut anmelden.', 401);
  if (response.status === 403) throw new ModerationApiError('Keine Berechtigung für diese Aktion.', 403);
  if (response.status === 404) throw new ModerationApiError('Nicht gefunden.', 404);
  if (response.status === 503) throw new ModerationApiError('Astra ist derzeit nicht erreichbar.', 503);

  if (!response.ok) {
    let message = 'Ein unerwarteter Fehler ist aufgetreten.';
    try {
      const body = await response.json();
      if (body?.detail) message = body.detail;
    } catch {
      // ignore
    }
    throw new ModerationApiError(message, response.status);
  }
  return response.json() as Promise<T>;
}

export const moderationApi = {
  // AutoMod
  async getAutomod(guildId: string): Promise<AutomodResponse> {
    const res = await apiClient.get(`/moderation/automod/${guildId}`);
    return handleResponse<AutomodResponse>(res);
  },
  async putAutomod(guildId: string, config: AutomodConfig | Record<string, unknown>): Promise<AutomodResponse> {
    const res = await apiClient.put(`/moderation/automod/${guildId}`, config);
    return handleResponse<AutomodResponse>(res);
  },

  // Modlog
  async getModlog(guildId: string): Promise<ModlogResponse> {
    const res = await apiClient.get(`/moderation/modlog/${guildId}`);
    return handleResponse<ModlogResponse>(res);
  },
  async putModlog(guildId: string, channelId: string): Promise<ModlogResponse> {
    const res = await apiClient.put(`/moderation/modlog/${guildId}`, { channel_id: channelId });
    return handleResponse<ModlogResponse>(res);
  },
  async deleteModlog(guildId: string): Promise<ModlogResponse> {
    const res = await apiClient.delete(`/moderation/modlog/${guildId}`);
    return handleResponse<ModlogResponse>(res);
  },

  // Warns
  async getGuildWarns(guildId: string): Promise<WarnsResponse> {
    const res = await apiClient.get(`/moderation/warns/${guildId}`);
    return handleResponse<WarnsResponse>(res);
  },
  async getWarns(guildId: string, memberId: string): Promise<WarnsResponse> {
    const res = await apiClient.get(`/moderation/warns/${guildId}/${memberId}`);
    return handleResponse<WarnsResponse>(res);
  },
  async deleteWarn(guildId: string, memberId: string, warnId: string): Promise<WarnsResponse> {
    const res = await apiClient.delete(`/moderation/warns/${guildId}/${memberId}?warn_id=${encodeURIComponent(warnId)}`);
    return handleResponse<WarnsResponse>(res);
  },
  async deleteAllWarnsGuild(guildId: string): Promise<WarnsResponse> {
    const res = await apiClient.delete(`/moderation/warns/${guildId}`);
    return handleResponse<WarnsResponse>(res);
  },
  async deleteAllWarns(guildId: string, memberId: string): Promise<WarnsResponse> {
    const res = await apiClient.delete(`/moderation/warns/${guildId}/${memberId}?all=true`);
    return handleResponse<WarnsResponse>(res);
  },
};

export type { ModerationApiError };
