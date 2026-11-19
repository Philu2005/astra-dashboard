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
      const startTime = performance.now();
      const timestamp = new Date().toISOString();
      console.log(`[Performance] fetchStats (/dashboard/stats) started at ${timestamp} (Relative: ${startTime.toFixed(2)}ms)`);
      try {
        const response = await apiClient.get('/dashboard/stats');
        const endTime = performance.now();
        const duration = endTime - startTime;
        console.log(`[Performance] fetchStats (/dashboard/stats) response received at ${new Date().toISOString()} (Duration: ${duration.toFixed(2)}ms, Relative: ${endTime.toFixed(2)}ms)`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json: DashboardStatsResponse = await response.json();
        const parseTime = performance.now();
        console.log(`[Performance] fetchStats (/dashboard/stats) parsed at ${new Date().toISOString()} (Parse duration: ${(parseTime - endTime).toFixed(2)}ms, Total relative: ${parseTime.toFixed(2)}ms)`);
        if (!cancelled) {
          setData(json);
          setError(false);
          console.log(`[Performance] fetchStats (/dashboard/stats) state updated at ${performance.now().toFixed(2)}ms`);
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

    // Re-fetch when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchStats();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const id = setInterval(fetchStats, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [intervalMs]);

  return { data, loading, error };
}
