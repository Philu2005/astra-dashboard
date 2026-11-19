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
    let retryCount = 0;
    let retryTimer: number | null = null;
    let generation = 0;

    const fetchStats = async (isRetry = false) => {
      if (pending && !isRetry) return;
      if (!isRetry) {
        generation++;
        if (retryTimer) {
          clearTimeout(retryTimer);
          retryTimer = null;
        }
        retryCount = 0;
      }
      
      const currentGeneration = generation;
      pending = true;
      const startTime = performance.now();
      const timestamp = new Date().toISOString();
      console.log(`[Performance] fetchStats (/dashboard/stats) started at ${timestamp} (Relative: ${startTime.toFixed(2)}ms, G:${currentGeneration}, Retry:${retryCount})`);
      
      try {
        const response = await apiClient.get('/dashboard/stats');
        const endTime = performance.now();
        
        if (cancelled || currentGeneration !== generation) return;

        const duration = endTime - startTime;
        console.log(`[Performance] fetchStats (/dashboard/stats) response received at ${new Date().toISOString()} (Duration: ${duration.toFixed(2)}ms, Status: ${response.status})`);
        
        if (!response.ok) {
          if (response.status === 502 || response.status === 503) {
            throw { status: response.status, isRetryable: true };
          }
          throw new Error(`HTTP ${response.status}`);
        }

        const json: DashboardStatsResponse = await response.json();
        if (cancelled || currentGeneration !== generation) return;

        setData(json);
        setError(false);
        retryCount = 0;
        console.log(`[Performance] fetchStats (/dashboard/stats) state updated at ${performance.now().toFixed(2)}ms`);
      } catch (err: any) {
        if (cancelled || currentGeneration !== generation) return;

        setError(true);
        console.error('[useDashboardStats] Fetch failed:', err);

        // Retry logic for 502/503
        if (err.isRetryable && retryCount < 5) {
          const delay = Math.pow(2, retryCount) * 1000;
          retryCount++;
          console.log(`[useDashboardStats] Retrying in ${delay}ms... (Attempt ${retryCount}/5)`);
          retryTimer = window.setTimeout(() => fetchStats(true), delay);
        }
      } finally {
        if (currentGeneration === generation) {
          pending = false;
          setLoading(false);
        }
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
      if (id) clearInterval(id);
      if (retryTimer) clearTimeout(retryTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [intervalMs]);

  return { data, loading, error };
}
