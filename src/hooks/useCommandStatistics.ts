import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import type { CommandStatisticsResponse } from '@/types/statistics';

export type CommandStatisticsState = {
  data: CommandStatisticsResponse | null;
  loading: boolean;
  error: boolean;
};

export function useCommandStatistics(refreshMs = 60_000): CommandStatisticsState {
  const [data, setData] = useState<CommandStatisticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let pending = false;

    const load = async () => {
      if (pending) return;
      pending = true;
      try {
        const res = await apiClient.get('/statistics/commands');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: CommandStatisticsResponse = await res.json();
        if (!cancelled) {
          setData(json);
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        pending = false;
        if (!cancelled) setLoading(false);
      }
    };

    load();
    const id = setInterval(load, refreshMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [refreshMs]);

  return { data, loading, error };
}
