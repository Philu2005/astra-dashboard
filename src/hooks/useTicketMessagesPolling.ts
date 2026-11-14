import { useEffect, useRef } from 'react';
import { supportApi } from '@/services/support-api';
import type { TicketDetail, TicketMessage } from '@/types/support';

/**
 * Polls ticket messages for the given ticketId at the specified interval (ms).
 * Only runs while ticketId is truthy; cleans up automatically on unmount or id change.
 */
export function useTicketMessagesPolling(
  ticketId: number | null,
  options: {
    intervalMs?: number;
    onUpdate: (updated: TicketDetail) => void;
    getCurrentMessages: () => TicketMessage[];
  }
) {
  const { intervalMs = 5000, onUpdate, getCurrentMessages } = options;
  const timerRef = useRef<number | null>(null);
  const kickoffRef = useRef<number | null>(null);
  const runningRef = useRef(false);

  useEffect(() => {
    if (!ticketId) return;

    async function tick() {
      if (runningRef.current) return; // avoid overlap
      runningRef.current = true;
      try {
        const id = ticketId;
        if (id == null) return; // safety
        const updated = await supportApi.getTicket(id);
        const current = getCurrentMessages();
        // Deduplicate: compare last IDs length or last id
        const lastCurrentId = current.length ? current[current.length - 1].id : 0;
        const lastUpdatedId = updated.messages.length ? updated.messages[updated.messages.length - 1].id : 0;
        if (updated.messages.length !== current.length || lastUpdatedId !== lastCurrentId) {
          onUpdate(updated);
        }
      } catch (e) {
        // Fehler protokollieren, aber Polling nicht stoppen
        if (import.meta.env.DEV) {
          console.warn('[messages-polling] Update fehlgeschlagen:', e);
        }
      } finally {
        runningRef.current = false;
      }
    }

    // Sofort initial ticken, danach Intervall
    tick();
    timerRef.current = window.setInterval(tick, intervalMs);
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (kickoffRef.current) {
        window.clearTimeout(kickoffRef.current);
        kickoffRef.current = null;
      }
    };
  }, [ticketId, intervalMs, onUpdate, getCurrentMessages]);
}
