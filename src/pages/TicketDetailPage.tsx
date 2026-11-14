import React, { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { StaticInfoPage } from '@/pages/StaticInfoPage';
import { useAuth } from '@/contexts/AuthContext';
import { supportApi } from '@/services/support-api';
import type { TicketDetail } from '@/types/support';
import { cn } from '@/lib/utils';
import { MessageList } from '@/components/support/MessageList';
import { useTicketMessagesPolling } from '@/hooks/useTicketMessagesPolling';

export const TicketDetailPage: React.FC<{ ticketId: number }> = ({ ticketId }) => {
  const { authenticated, loading, user } = useAuth();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

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

  // Polling neuer Nachrichten, solange das Ticket geöffnet ist
  useTicketMessagesPolling(ticket?.id ?? null, {
    intervalMs: 4500,
    onUpdate: (updated) => {
      setTicket(updated);
    },
    getCurrentMessages: () => ticket?.messages ?? [],
  });

  if (loading) {
    return <StaticInfoPage title="Wird geladen..." description="Deine Sitzung wird überprüft." />
  }
  if (!authenticated) {
    return <StaticInfoPage title="Nicht angemeldet" description="Bitte melde dich an, um Tickets zu sehen." showHomeActions />
  }

  return (
    <DashboardLayout>
      <div className="mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 2xl:max-w-[1600px]">
        <div className="flex items-center justify-between gap-3">
          <button onClick={() => window.history.back()} className="text-[#8a90ad] hover:text-[#d6dbf0] text-[0.9rem]">← Zurück</button>
        </div>
        <div className="mt-3 rounded-2xl border border-[#2a2f45] bg-[#131625]">
          <div className="px-5 py-4 border-b border-[#212131]">
            {loadingDetail ? (
              <div className="text-[#8a90ad]">Laden…</div>
            ) : ticket ? (
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="text-white font-semibold text-2xl truncate">{ticket.subject}</h1>
                  <p className="text-[#9ca2bd] text-[0.9rem] truncate">#{ticket.ticket_number} • {ticket.category}</p>
                </div>
                <span className={cn(
                  "px-2 py-1 rounded-md text-[0.78rem] border shrink-0",
                  ticket.status === 'open' && 'border-[#35406a] bg-[#171e33] text-[#a5c0ff]',
                  ticket.status === 'in_progress' && 'border-[#5b4cc8]/40 bg-astra-purple/10 text-[#c4b5fd]',
                  ticket.status === 'resolved' && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
                  ticket.status === 'closed' && 'border-[#3a3f59] bg-[#161a2d] text-[#8a90ad]'
                )}>
                  {ticket.status}
                </span>
              </div>
            ) : (
              <div className="text-red-400">{error || 'Ticket nicht gefunden'}</div>
            )}
          </div>

          {/* Verlauf */}
          {ticket && (
            <MessageList messages={ticket.messages} currentUserId={currentUserId} adminView={false} />
          )}

          {/* Antwortfeld */}
          {ticket && (
            <div className="px-5 pb-5">
              {ticket.status === 'closed' ? (
                <div className="text-[#8a90ad] text-[0.9rem]">Dieses Ticket ist geschlossen und kann nicht mehr beantwortet werden.</div>
              ) : (
                <form onSubmit={handleReply} className="space-y-2">
                  <label className="block text-[0.82rem] text-[#8a90ad]">Antwort</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full min-h-32 rounded-lg bg-[#0f1220] border border-[#2a2f45] px-3 py-3 text-white placeholder:text-[#596189] focus:outline-none focus:border-astra-purple/40"
                    placeholder="Schreibe deine Nachricht…"
                  />
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
