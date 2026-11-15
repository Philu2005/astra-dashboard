import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { StaticInfoPage } from '@/pages/StaticInfoPage';
import { useAuth } from '@/contexts/AuthContext';
import { supportApi } from '@/services/support-api';
import type { TicketDetail } from '@/types/support';
import { STATUS_LABELS } from '@/types/support';
import { cn } from '@/lib/utils';
import { CharCounter } from '@/components/support/CharCounter';
import { MessageList } from '@/components/support/MessageList';
import { useTicketMessagesPolling } from '@/hooks/useTicketMessagesPolling';

export const TicketDetailPage: React.FC<{ ticketId: number }> = ({ ticketId }) => {
  const { authenticated, loading, user } = useAuth();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [reopening, setReopening] = useState(false);

  const currentUserId = user?.id ?? null;

  useEffect(() => {
    if (!authenticated) return;
    let mounted = true;
    setLoadingDetail(true);
    supportApi
      .getTicket(ticketId)
      .then((d) => { if (mounted) { setTicket(d); setError(null); } })
      .catch((e) => { if (mounted) { setError(e.message || 'Ticket konnte nicht geladen werden'); } })
      .finally(() => mounted && setLoadingDetail(false));
    return () => { mounted = false };
  }, [authenticated, ticketId]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    try {
      setSending(true);
      const updated = await supportApi.reply(ticketId, { message });
      setTicket(updated);
      setMessage('');
    } catch (e: any) {
      setError(e.message || 'Antwort konnte nicht gesendet werden');
    } finally {
      setSending(false);
    }
  };

  const handleReopen = async () => {
    try {
      setReopening(true);
      const updated = await supportApi.reopenTicket(ticketId);
      setTicket(updated);
    } catch (e: any) {
      setError(e.message || 'Ticket konnte nicht wieder geöffnet werden');
    } finally {
      setReopening(false);
    }
  };

  useTicketMessagesPolling(ticket?.id ?? null, {
    intervalMs: 4500,
    onUpdate: (updated) => {
      setTicket(updated);
    },
    getCurrentMessages: () => ticket?.messages ?? [],
  });

  if (!authenticated && !loading) {
    return <StaticInfoPage title="Nicht angemeldet" description="Bitte melde dich an, um Tickets zu sehen." showHomeActions />
  }

  return (
    <DashboardLayout>
      <div className="mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 2xl:max-w-[1600px] h-full flex flex-col min-h-0">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => window.history.back()}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[0.9rem] transition-colors',
              'border-[#2a2f45] text-[#8a90ad] bg-[#0f1220] hover:text-[#d6dbf0] hover:border-astra-purple/40'
            )}
            aria-label="Zurück"
          >
            ← <span>Zurück</span>
          </button>
        </div>
        <div className="mt-3 rounded-2xl border border-[#2a2f45] bg-[#131625] flex flex-col flex-1 min-h-0 shadow-[0_0_0_1px_rgba(104,97,225,0.08),0_30px_60px_-20px_rgba(0,0,0,0.45)]">
          <div className="px-5 py-4 border-b border-[#212131] bg-[linear-gradient(180deg,rgba(75,70,200,0.08)_0%,rgba(75,70,200,0)_100%)] shrink-0">
            {loadingDetail ? (
              <div className="text-[#8a90ad]">Laden…</div>
            ) : ticket ? (
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <h1 className="text-white font-semibold text-2xl truncate">{ticket.subject}</h1>
                  <p className="text-[#9ca2bd] text-[0.9rem] truncate">#{ticket.ticket_number} • {ticket.category}</p>
                </div>
                <span className={cn(
                  "px-2 py-1 rounded-md text-[0.78rem] border shrink-0",
                  ticket.status === 'open' && 'border-[#35406a] bg-[#171e33] text-[#a5c0ff]',
                  ticket.status === 'in_progress' && 'border-[#5b4cc8]/40 bg-astra-purple/10 text-[#c4b5fd]',
                  ticket.status === 'resolved' && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
                )}>
                  {STATUS_LABELS[ticket.status] ?? ticket.status}
                </span>
              </div>
            ) : (
              <div className="text-red-400">{error || 'Ticket nicht gefunden'}</div>
            )}
          </div>

          {ticket && (
            <MessageList messages={ticket.messages} currentUserId={currentUserId} adminView={false} ticket={ticket} />
          )}

          {ticket && (
            // Compose-Bereich: Safe-Area-Padding für Mobile-Tastatur
            <div className="px-5 pb-[env(safe-area-inset-bottom)] pb-5 pt-2 shrink-0">
              {ticket.status === 'resolved' ? (
                <div className="space-y-3">
                  <div className="text-[#9ca2bd] text-[0.9rem]">Dieses Ticket wurde als gelöst markiert.</div>
                  <button
                    onClick={handleReopen}
                    disabled={reopening}
                    className={cn(
                      'inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 font-semibold transition-all duration-200',
                      reopening
                        ? 'bg-[#171a2b] border-[#2a2f45] text-[#8a90ad] cursor-wait'
                        : 'bg-[linear-gradient(138deg,#6460e6_0%,#4b46c8_58%,#3e3aa2_100%)] border-[#6861e1] text-white hover:translate-y-[-1px]'
                    )}
                  >
                    {reopening ? 'Öffne…' : 'Ticket wieder öffnen'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleReply} className="space-y-2">
                  <label className="block text-[0.82rem] text-[#8a90ad]">Antwort</label>
                  <textarea
                    value={message}
                    onChange={(e) => { if (e.target.value.length <= 8000) setMessage(e.target.value); }}
                    maxLength={8000}
                    className="w-full min-h-32 rounded-lg bg-[#0f1220] border border-[#2a2f45] px-3 py-3 text-white placeholder:text-[#596189] focus:outline-none focus:border-astra-purple/40"
                    placeholder="Schreibe deine Nachricht…"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !('ontouchstart' in window)) {
                        e.preventDefault();
                        if (message.trim() && !sending) handleReply(e as unknown as React.FormEvent);
                      }
                    }}
                  />
                  <CharCounter current={message.length} max={8000} warn={200} />
                  <div className="flex items-center gap-3">
                    <button
                      disabled={sending || !message.trim()}
                      className={cn(
                        'inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 font-semibold transition-all duration-200',
                        sending || !message.trim()
                          ? 'bg-[#171a2b] border-[#2a2f45] text-[#8a90ad] cursor-not-allowed'
                          : 'bg-[linear-gradient(138deg,#6460e6_0%,#4b46c8_58%,#3e3aa2_100%)] border-[#6861e1] text-white hover:translate-y-[-1px]'
                      )}
                    >
                      {sending ? 'Sende…' : 'Antwort senden'}
                    </button>
                    {error && <span className="text-red-400 text-[0.9rem]">{error}</span>}
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TicketDetailPage;
