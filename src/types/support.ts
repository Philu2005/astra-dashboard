export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface TicketSummary {
  id: number;
  ticket_number: string;
  user_id: string;
  user_name: string;
  subject: string;
  category: string;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: number;
  author_id: string;
  author_name: string;
  is_admin: boolean;
  message: string;
  created_at: string;
}

export interface TicketDetail extends Omit<TicketSummary, 'updated_at'> {
  updated_at: string;
  closed_at?: string | null;
  messages: TicketMessage[];
}

export interface TicketCreate {
  subject: string;
  category: string;
  description: string;
}

export interface MessageCreate { message: string }

export interface TicketCounters {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
}

// Zentrale, vorgegebene Kategorien
export const SUPPORT_CATEGORIES: readonly string[] = [
  'Fehler melden',
  'Problem mit einem Befehl',
  'Problem mit einer Funktion',
  'Verbesserungsvorschlag',
  'Allgemeine Frage',
  'Sonstiges',
] as const;
