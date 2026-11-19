import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import type { CommandStatisticsResponse } from '@/types/statistics';

export type CommandStatisticsState = {
  data: CommandStatisticsResponse | null;
  loading: boolean;
  error: boolean;
};

export function useCommandStatistics(refreshMs = 30_000): CommandStatisticsState {
  const [data, setData] = useState<CommandStatisticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let pending = false;

    const load = async () => {
      if (pending) return;
      pending = true;
      const startTime = performance.now();
      console.log(`[Performance] useCommandStatistics (/statistics/commands) started at ${new Date().toISOString()}`);
      try {
        const res = await apiClient.get('/statistics/commands');
        const duration = performance.now() - startTime;
        console.log(`[Performance] useCommandStatistics (/statistics/commands) finished: HTTP ${res.status}, duration: ${duration.toFixed(2)}ms`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: CommandStatisticsResponse = await res.json();
        if (!cancelled) {
          setData(json);
          setError(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(true);
          console.error('[useCommandStatistics] Fetch failed:', err);
        }
      } finally {
        pending = false;
        if (!cancelled) setLoading(false);
      }
    };

    load();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        load();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const id = setInterval(load, refreshMs);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshMs]);

  return { data, loading, error };
}
