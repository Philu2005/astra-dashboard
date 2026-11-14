import { apiClient } from '@/lib/api-client';
import type {
  TicketSummary,
  TicketDetail,
  TicketCreate,
  MessageCreate,
  TicketCounters,
  TicketStatus,
} from '@/types/support';

function ensureJson<T = unknown>(res: Response): Promise<T> {
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    return res.json();
  }
  return res.text().then((text) => {
    const preview = text.slice(0, 200).replace(/\s+/g, ' ').trim();
    throw new Error(`Unerwartete Antwort (Content-Type: ${ct || 'unbekannt'}, Status ${res.status}): ${preview}`);
  });
}

export const supportApi = {
  async listMyTickets(params?: { offset?: number; limit?: number }): Promise<TicketSummary[]> {
    const q = new URLSearchParams();
    if (params?.offset) q.set('offset', String(params.offset));
    if (params?.limit) q.set('limit', String(params.limit));
    const res = await apiClient.get(`/support/tickets${q.toString() ? `?${q.toString()}` : ''}`);
    if (!res.ok) throw new Error(`Fehler beim Laden der Tickets (${res.status})`);
    return ensureJson(res);
  },

  async createTicket(payload: TicketCreate): Promise<TicketDetail> {
    const res = await apiClient.post('/support/tickets', payload);
    if (!res.ok) throw new Error(`Ticket konnte nicht erstellt werden (${res.status})`);
    return ensureJson(res);
  },

  async getTicket(ticketId: number): Promise<TicketDetail> {
    const res = await apiClient.get(`/support/tickets/${ticketId}`);
    if (!res.ok) throw new Error(`Ticket konnte nicht geladen werden (${res.status})`);
    return ensureJson(res);
  },

  async reply(ticketId: number, payload: MessageCreate): Promise<TicketDetail> {
    const res = await apiClient.post(`/support/tickets/${ticketId}/reply`, payload);
    if (!res.ok) throw new Error(`Antwort konnte nicht gesendet werden (${res.status})`);
    return ensureJson(res);
  },

  // Admin
  async counters(): Promise<TicketCounters> {
    const res = await apiClient.get('/support/admin/counters');
    if (!res.ok) throw new Error(`Zähler konnten nicht geladen werden (${res.status})`);
    return ensureJson(res);
  },

  async listAll(params?: { status?: TicketStatus; category?: string; search?: string; offset?: number; limit?: number }): Promise<TicketSummary[]> {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.category) q.set('category', params.category);
    if (params?.search) q.set('search', params.search);
    if (params?.offset != null) q.set('offset', String(params.offset));
    if (params?.limit != null) q.set('limit', String(params.limit));
    const res = await apiClient.get(`/support/admin/tickets${q.toString() ? `?${q.toString()}` : ''}`);
    if (!res.ok) throw new Error(`Tickets konnten nicht geladen werden (${res.status})`);
    return ensureJson(res);
  },

  async setStatus(ticketId: number, status: TicketStatus): Promise<TicketDetail> {
    const res = await apiClient.post(`/support/admin/tickets/${ticketId}/status`, { status });
    if (!res.ok) throw new Error(`Status konnte nicht gesetzt werden (${res.status})`);
    return ensureJson(res);
  },
};
