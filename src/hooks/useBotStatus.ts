import { useState, useEffect } from 'react';
import { serverApi } from '@/services/server-api';

export type BotStatus = 'loading' | 'online' | 'offline' | 'connecting' | 'unknown' | 'api_error';

export const botStatusConfig: Record<BotStatus, { label: string; labelShort: string; dotColor: string; bg: string; text: string; border: string }> = {
  online:     { label: 'Online',               labelShort: 'Astra ist online',          dotColor: 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.75)]',   bg: 'bg-emerald-500/18', text: 'text-emerald-300', border: 'border-emerald-500/30' },
  offline:    { label: 'Offline',              labelShort: 'Astra ist offline',          dotColor: 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.75)]',    bg: 'bg-red-500/18',     text: 'text-red-300',     border: 'border-red-500/30' },
  connecting: { label: 'Verbindet\u2026',          labelShort: 'Astra verbindet\u2026',          dotColor: 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.75)]',  bg: 'bg-yellow-500/18',  text: 'text-yellow-300',  border: 'border-yellow-500/30' },
  unknown:    { label: 'Unbekannt',            labelShort: 'Status unbekannt',           dotColor: 'bg-gray-400 shadow-[0_0_10px_rgba(156,163,175,0.4)]',    bg: 'bg-gray-500/18',    text: 'text-gray-300',    border: 'border-gray-500/30' },
  api_error:  { label: 'API nicht erreichbar', labelShort: 'API nicht erreichbar',       dotColor: 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.75)]',    bg: 'bg-red-500/18',     text: 'text-red-300',     border: 'border-red-500/30' },
  loading:    { label: '',                     labelShort: '',                           dotColor: 'bg-gray-400 animate-pulse',                              bg: 'bg-gray-500/18',    text: 'text-gray-400',    border: 'border-gray-500/30' },
};

export function useBotStatus(intervalMs = 15_000) {
  const [status, setStatus] = useState<BotStatus>('loading');

  useEffect(() => {
    let cancelled = false;
    let pending = false;

    const fetchStatus = async () => {
      if (pending) return;
      pending = true;
      try {
        const data = await serverApi.getAstraStatus();
        if (!cancelled) {
          if (data.status && ['online', 'offline', 'connecting', 'unknown'].includes(data.status)) {
            setStatus(data.status);
          } else {
            setStatus(data.online ? 'online' : 'offline');
          }
        }
      } catch {
        if (!cancelled) {
          setStatus('api_error');
        }
      } finally {
        pending = false;
      }
    };

    fetchStatus();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchStatus();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const id = setInterval(fetchStatus, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [intervalMs]);

  return status;
}
