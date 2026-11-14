import { apiClient } from '@/lib/api-client';

export interface DayHistory {
  date: string;
  status: string;
  uptime_percent: number;
}

export interface ServiceStatus {
  id: number;
  name: string;
  description: string;
  service_type: string;
  current_status: string;
  uptime_percent: number;
  response_time_ms: number | null;
  last_check: string | null;
  daily_history: DayHistory[];
}

export interface OverallStatus {
  status: string;
  label: string;
  services: ServiceStatus[];
}

export interface Incident {
  id: number;
  service_name: string;
  title: string;
  status: string;
  started_at: string;
  resolved_at: string | null;
  description: string;
}

export interface StatusPageData {
  overall: OverallStatus;
  incidents: Incident[];
  last_updated: string | null;
}

export const statusApi = {
  async getStatusPage(): Promise<StatusPageData> {
    const res = await apiClient.get('/status/');
    if (!res.ok) throw new Error(`Status API error: ${res.status}`);
    return res.json();
  },
};
