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
      console.log(`[Performance] useCommandStatistics (/statistics/commands) started at ${new Date().toISOString()} (Relative: ${startTime.toFixed(2)}ms)`);
      try {
        const res = await apiClient.get('/statistics/commands');
        const endTime = performance.now();
        const duration = endTime - startTime;
        console.log(`[Performance] useCommandStatistics (/statistics/commands) response received at ${new Date().toISOString()} (Duration: ${duration.toFixed(2)}ms, Relative: ${endTime.toFixed(2)}ms)`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: CommandStatisticsResponse = await res.json();
        const parseTime = performance.now();
        console.log(`[Performance] useCommandStatistics (/statistics/commands) parsed at ${new Date().toISOString()} (Parse duration: ${(parseTime - endTime).toFixed(2)}ms, Total relative: ${parseTime.toFixed(2)}ms)`);
        if (!cancelled) {
          setData(json);
          setError(false);
          console.log(`[Performance] useCommandStatistics (/statistics/commands) state updated at ${performance.now().toFixed(2)}ms`);
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
