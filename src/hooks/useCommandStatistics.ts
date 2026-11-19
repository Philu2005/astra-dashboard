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
    let retryCount = 0;
    let retryTimer: number | null = null;
    let generation = 0;

    const load = async (isRetry = false) => {
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
      console.log(`[Performance] useCommandStatistics (/statistics/commands) started at ${new Date().toISOString()} (Relative: ${startTime.toFixed(2)}ms, G:${currentGeneration}, Retry:${retryCount})`);
      
      try {
        const res = await apiClient.get('/statistics/commands');
        const endTime = performance.now();
        
        if (cancelled || currentGeneration !== generation) return;

        const duration = endTime - startTime;
        console.log(`[Performance] useCommandStatistics (/statistics/commands) response received at ${new Date().toISOString()} (Duration: ${duration.toFixed(2)}ms, Status: ${res.status})`);
        
        if (!res.ok) {
          if (res.status === 502 || res.status === 503) {
            throw { status: res.status, isRetryable: true };
          }
          throw new Error(`HTTP ${res.status}`);
        }

        const json: CommandStatisticsResponse = await res.json();
        if (cancelled || currentGeneration !== generation) return;

        setData(json);
        setError(false);
        retryCount = 0;
        console.log(`[Performance] useCommandStatistics (/statistics/commands) state updated at ${performance.now().toFixed(2)}ms`);
      } catch (err: any) {
        if (cancelled || currentGeneration !== generation) return;

        setError(true);
        console.error('[useCommandStatistics] Fetch failed:', err);

        // Retry logic for 502/503
        if (err.isRetryable && retryCount < 5) {
          const delay = Math.pow(2, retryCount) * 1000;
          retryCount++;
          console.log(`[useCommandStatistics] Retrying in ${delay}ms... (Attempt ${retryCount}/5)`);
          retryTimer = window.setTimeout(() => load(true), delay);
        }
      } finally {
        if (currentGeneration === generation) {
          pending = false;
          setLoading(false);
        }
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
      if (id) clearInterval(id);
      if (retryTimer) clearTimeout(retryTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshMs]);

  return { data, loading, error };
}
