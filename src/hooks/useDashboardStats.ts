import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export interface DashboardStatsResponse {
  stats: {
    users: number;
    guilds: number;
    commands: number;
  };
  last_successful_sync: string | null;
  stale: boolean;
}

export type DashboardStatsState = {
  data: DashboardStatsResponse | null;
  loading: boolean;
  error: boolean;
};

/**
 * Lädt die globalen Dashboard-Statistiken von `/dashboard/stats`.
 * Aktualisiert automatisch alle `intervalMs` Millisekunden (Standard: 60 s).
 *
 * Hinweis: Der Backend-Endpunkt `/dashboard/stats` muss die Felder
 * `stats` (users, guilds, commands), `last_successful_sync` und `stale` liefern.
 */
export function useDashboardStats(intervalMs = 15_000): DashboardStatsState {
  const [data, setData] = useState<DashboardStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let pending = false;

    const fetchStats = async () => {
      if (pending) return;
      pending = true;
      try {
        const response = await apiClient.get('/dashboard/stats');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json: DashboardStatsResponse = await response.json();
        if (!cancelled) {
          setData(json);
          setError(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(true);
          console.error('[useDashboardStats] Fetch failed:', err);
        }
      } finally {
        pending = false;
        if (!cancelled) setLoading(false);
      }
    };

    fetchStats();
    const id = setInterval(fetchStats, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs]);

  return { data, loading, error };
}
