import { apiClient } from '@/lib/api-client';

class TicketsApiError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = 'TicketsApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) throw new TicketsApiError('Sitzung abgelaufen. Bitte erneut anmelden.', 401);
  if (response.status === 403) throw new TicketsApiError('Keine Berechtigung für diese Aktion.', 403);
  if (response.status === 404) throw new TicketsApiError('Nicht gefunden.', 404);
  if (response.status === 503) throw new TicketsApiError('Astra ist derzeit nicht erreichbar.', 503);
  if (!response.ok) {
    let message = 'Ein unerwarteter Fehler ist aufgetreten.';
    try {
      const body = await response.json();
      if (body?.detail) message = body.detail;
    } catch {
      // ignore
    }
    throw new TicketsApiError(message, response.status);
  }
  return response.json() as Promise<T>;
}

// --- Types ---

export interface TicketConfig {
  [key: string]: unknown;
}

export interface TicketConfigResponse {
  success: boolean;
  config: TicketConfig;
}

export interface TicketPanel {
  channel_id?: string;
  panel_message_id?: string;
  title?: string;
  description?: string;
  support_role_id?: string;
  category_id?: string;
  topic?: string;
  embed_color?: string;
  footer?: string;
  image_url?: string;
  thumbnail_url?: string;
  button_label?: string;
  button_emoji?: string;
  [key: string]: unknown;
}

export interface TicketPanelsResponse {
  success: boolean;
  panels: TicketPanel[];
}

export interface TicketPanelPublishRequest {
  channel_id: string;
  title?: string;
  description?: string;
}

export interface TicketPanelPublishResponse {
  success: boolean;
  message: string;
  panel_message_id?: string;
}

export interface TicketPanelUpdateResponse {
  success: boolean;
  message: string;
}

export interface TicketPanelConfigRequest {
  channel_id?: string;
  support_role_id?: string;
  category_id?: string;
  topic?: string;
  title?: string;
  description?: string;
  embed_color?: string;
  footer?: string;
  image_url?: string;
  thumbnail_url?: string;
  button_label?: string;
  button_emoji?: string;
}

export interface TicketPanelConfigResponse {
  success: boolean;
  message: string;
  channel_id?: string;
  panel_message_id?: string;
}

export interface TicketPanelDeleteResponse {
  success: boolean;
  message: string;
}

export interface TicketPanelStatusResponse {
  success: boolean;
  status: Record<string, unknown>;
}

export interface OpenTicket {
  channel_id?: string;
  user_id?: string;
  opened_at?: string;
  [key: string]: unknown;
}

export interface TicketStatusResponse {
  success: boolean;
  tickets: OpenTicket[];
}

export interface TicketLogResponse {
  success: boolean;
  channel_id: string | null;
}

export interface TicketLogDeleteResponse {
  success: boolean;
  message: string;
}

// --- API ---

export const ticketsApi = {
  // Konfiguration
  async getConfig(guildId: string): Promise<TicketConfigResponse> {
    const res = await apiClient.get(`/tickets/config/${guildId}`);
    return handleResponse<TicketConfigResponse>(res);
  },
  async putConfig(guildId: string, config: TicketConfig): Promise<TicketConfigResponse> {
    const res = await apiClient.put(`/tickets/config/${guildId}`, { config });
    return handleResponse<TicketConfigResponse>(res);
  },

  // Panels
  async getPanels(guildId: string): Promise<TicketPanelsResponse> {
    const res = await apiClient.get(`/tickets/panels/${guildId}`);
    return handleResponse<TicketPanelsResponse>(res);
  },
  async publishPanel(guildId: string, payload: TicketPanelPublishRequest): Promise<TicketPanelPublishResponse> {
    const res = await apiClient.post(`/tickets/panels/${guildId}/publish`, payload);
    return handleResponse<TicketPanelPublishResponse>(res);
  },
  async updatePanel(guildId: string, channelId: string, payload: { title?: string; description?: string }): Promise<TicketPanelUpdateResponse> {
    const res = await apiClient.put(`/tickets/panels/${guildId}/${channelId}/update`, payload);
    return handleResponse<TicketPanelUpdateResponse>(res);
  },
  async updatePanelConfig(guildId: string, channelId: string, payload: TicketPanelConfigRequest): Promise<TicketPanelConfigResponse> {
    const res = await apiClient.put(`/tickets/panels/${guildId}/${channelId}/config`, payload);
    return handleResponse<TicketPanelConfigResponse>(res);
  },
  async deletePanel(guildId: string, channelId: string, messageId: string): Promise<TicketPanelDeleteResponse> {
    const res = await apiClient.delete(`/tickets/panels/${guildId}/${channelId}/${messageId}`);
    return handleResponse<TicketPanelDeleteResponse>(res);
  },
  async getPanelsStatus(guildId: string): Promise<TicketPanelStatusResponse> {
    const res = await apiClient.get(`/tickets/panels/${guildId}/status`);
    return handleResponse<TicketPanelStatusResponse>(res);
  },

  // Offene Tickets
  async getOpenTickets(guildId: string): Promise<TicketStatusResponse> {
    const res = await apiClient.get(`/tickets/status/${guildId}`);
    return handleResponse<TicketStatusResponse>(res);
  },

  // Ticket-Log
  async getLog(guildId: string): Promise<TicketLogResponse> {
    const res = await apiClient.get(`/tickets/log/${guildId}`);
    return handleResponse<TicketLogResponse>(res);
  },
  async putLog(guildId: string, channelId: string): Promise<TicketLogResponse> {
    const res = await apiClient.put(`/tickets/log/${guildId}`, { channel_id: channelId });
    return handleResponse<TicketLogResponse>(res);
  },
  async deleteLog(guildId: string): Promise<TicketLogDeleteResponse> {
    const res = await apiClient.delete(`/tickets/log/${guildId}`);
    return handleResponse<TicketLogDeleteResponse>(res);
  },
};

export type { TicketsApiError };
