export type TicketStatus = 'open' | 'in_progress' | 'resolved';
export type TicketPriority = 'low' | 'normal' | 'high' | 'critical';
export type MessageType = 'user' | 'support' | 'system';

export interface TicketSummary {
  id: number;
  ticket_number: string;
  user_id: string;
  user_name: string;
  subject: string;
  category: string;
  status: TicketStatus;
  priority: TicketPriority;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: number;
  author_id: string;
  author_name: string;
  is_admin: boolean;
  message: string;
  message_type: MessageType;
  event_type?: string | null;
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
}

export interface UserInfo {
  user_id: string;
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  account_created_at?: string | null;
  total_tickets: number;
  open_tickets: number;
  resolved_tickets: number;
  in_progress_tickets: number;
  last_support_activity?: string | null;
}

export interface UserHistoryItem {
  id: number;
  ticket_number: string;
  subject: string;
  category: string;
  status: TicketStatus;
  priority: TicketPriority;
  created_at: string;
  updated_at: string;
}

// Deutsche Statusbezeichnungen
export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Offen',
  in_progress: 'In Bearbeitung',
  resolved: 'Gelöst',
};

// Deutsche Prioritätsbezeichnungen
export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: 'Niedrig',
  normal: 'Normal',
  high: 'Hoch',
  critical: 'Kritisch',
};

// Zentrale, vorgegebene Kategorien
export const SUPPORT_CATEGORIES: readonly string[] = [
  'Fehler melden',
  'Problem mit einem Befehl',
  'Problem mit einer Funktion',
  'Verbesserungsvorschlag',
  'Allgemeine Frage',
  'Sonstiges',
] as const;
