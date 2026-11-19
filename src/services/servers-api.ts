import { apiClient } from '@/lib/api-client';

export interface GuildRole {
  id: string;
  name: string;
  color?: number;
}

export interface GuildChannel {
  id: string;
  name: string;
  type?: number; // Discord channel type
  parent_id?: string | null;
  position?: number;
}

export interface GuildCategory {
  id: string;
  name: string;
  position?: number;
}

function ensureJson<T = unknown>(res: Response): Promise<T> {
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  return res.text().then((t) => {
    const preview = t.slice(0, 160).replace(/\s+/g, ' ').trim();
    throw new Error(`Unerwartete Antwort (${res.status}): ${preview}`);
  });
}

export const serversApi = {
  async getRoles(guildId: string): Promise<{ roles: GuildRole[] }> {
    const res = await apiClient.get(`/servers/${guildId}/roles`);
    if (!res.ok) throw new Error(`Rollen konnten nicht geladen werden (${res.status})`);
    return ensureJson(res);
  },

  async getChannels(guildId: string): Promise<{ channels: GuildChannel[] }> {
    const res = await apiClient.get(`/servers/${guildId}/channels`);
    if (!res.ok) throw new Error(`Kanäle konnten nicht geladen werden (${res.status})`);
    return ensureJson(res);
  },

  async getCategories(guildId: string): Promise<{ categories: GuildCategory[] }> {
    const res = await apiClient.get(`/servers/${guildId}/categories`);
    if (!res.ok) throw new Error(`Kategorien konnten nicht geladen werden (${res.status})`);
    return ensureJson(res);
  },
};

export default serversApi;
