import React, { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { StaticInfoPage } from '@/pages/StaticInfoPage';
import { useAuth } from '@/contexts/AuthContext';
import { supportApi } from '@/services/support-api';
import type { TicketCounters, TicketDetail, TicketStatus, TicketSummary } from '@/types/support';
import { SUPPORT_CATEGORIES } from '@/types/support';
import { cn } from '@/lib/utils';

const ADMIN_ID = '789555434201677824';

export const AdminTicketsPage: React.FC = () => {
  const { authenticated, loading, user } = useAuth();
  const isAdmin = authenticated && user?.id === ADMIN_ID;

  const [counters, setCounters] = useState<TicketCounters | null>(null);
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState<TicketStatus | ''>('');
  const [category, setCategory] = useState<string>('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<TicketSummary | null>(null);
  const [detail, setDetail] = useState<TicketDetail | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const load = async () => {
    try {
      setLoadingList(true);
      const [c, list] = await Promise.all([
        supportApi.counters(),
        supportApi.listAll({ status: status || undefined, category: category || undefined, search: search || undefined, limit: 100 }),
      ]);
      setCounters(c);
      setTickets(list);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Tickets konnten nicht geladen werden');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  useEffect(() => {
    if (!selected) { setDetail(null); return; }
    let mounted = true;
    supportApi.getTicket(selected.id)
      .then((d) => { if (mounted) setDetail(d); })
      .catch(() => { if (mounted) setDetail(null); });
    return () => { mounted = false };
  }, [selected]);

  const handleApplyFilters = (e: React.FormEvent) => { e.preventDefault(); load(); };

  const handleSetStatus = async (ticketId: number, newStatus: TicketStatus) => {
    try {
      const updated = await supportApi.setStatus(ticketId, newStatus);
      setDetail(updated);
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status: updated.status, updated_at: updated.updated_at } : t)));
      setCounters(await supportApi.counters());
    } catch (e: any) {
      setError(e.message || 'Status konnte nicht gesetzt werden');
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail || !reply.trim()) return;
    try {
      setSending(true);
      const updated = await supportApi.reply(detail.id, { message: reply });
      setDetail(updated);
      setReply('');
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? { ...t, updated_at: updated.updated_at } : t)));
    } catch (e: any) {
      setError(e.message || 'Antwort konnte nicht gesendet werden');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <StaticInfoPage title="Wird geladen..." description="Deine Sitzung wird überprüft." />
  }
  if (!isAdmin) {
    return <StaticInfoPage title="Kein Zugriff" description="Diese Seite ist nur für den Administrator verfügbar." showHomeActions />
  }

  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Linke Spalte: Kennzahlen + Filter */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-[#2a2f45] bg-[#131625] p-5">
            <h2 className="text-white font-semibold mb-3">Übersicht</h2>
            {counters ? (
              <div className="grid grid-cols-2 gap-3 text-[0.95rem]">
                <div className="rounded-xl border border-[#2a2f45] bg-[#0f1220] p-3"><div className="text-[#8a90ad]">Gesamt</div><div className="text-white text-xl font-bold">{counters.total}</div></div>
                <div className="rounded-xl border border-[#2a2f45] bg-[#0f1220] p-3"><div className="text-[#8a90ad]">Offen</div><div className="text-white text-xl font-bold">{counters.open}</div></div>
                <div className="rounded-xl border border-[#2a2f45] bg-[#0f1220] p-3"><div className="text-[#8a90ad]">In Bearbeitung</div><div className="text-white text-xl font-bold">{counters.in_progress}</div></div>
                <div className="rounded-xl border border-[#2a2f45] bg-[#0f1220] p-3"><div className="text-[#8a90ad]">Gelöst</div><div className="text-white text-xl font-bold">{counters.resolved}</div></div>
                <div className="rounded-xl border border-[#2a2f45] bg-[#0f1220] p-3 col-span-2"><div className="text-[#8a90ad]">Geschlossen</div><div className="text-white text-xl font-bold">{counters.closed}</div></div>
              </div>
            ) : error ? (
              <div className="text-red-400 text-[0.9rem]">{error}</div>
            ) : loadingList ? (
              <div className="text-[#8a90ad]">Laden…</div>
            ) : (
              <div className="text-[#8a90ad]">Keine Daten verfügbar.</div>
            )}
          </div>

          <form onSubmit={handleApplyFilters} className="rounded-2xl border border-[#2a2f45] bg-[#131625] p-5 space-y-3">
            <h2 className="text-white font-semibold">Filter</h2>
            <div>
              <label className="block text-[0.82rem] text-[#8a90ad] mb-1">Suche</label>
              <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full h-10 rounded-lg bg-[#0f1220] border border-[#2a2f45] px-3 text-white placeholder:text-[#596189] focus:outline-none focus:border-astra-purple/40" placeholder="Ticketnummer, Nutzer, Betreff" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[0.82rem] text-[#8a90ad] mb-1">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as TicketStatus | '')} className="w-full h-10 rounded-lg bg-[#0f1220] border border-[#2a2f45] px-3 text-white focus:outline-none focus:border-astra-purple/40">
                  <option value="">Alle</option>
                  <option value="open">open</option>
                  <option value="in_progress">in_progress</option>
                  <option value="resolved">resolved</option>
                  <option value="closed">closed</option>
                </select>
              </div>
              <div>
                <label className="block text-[0.82rem] text-[#8a90ad] mb-1">Kategorie</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full h-10 rounded-lg bg-[#0f1220] border border-[#2a2f45] px-3 text-white focus:outline-none focus:border-astra-purple/40">
                  <option value="">Alle</option>
                  {SUPPORT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 font-semibold transition-all duration-200 bg-[linear-gradient(138deg,#6460e6_0%,#4b46c8_58%,#3e3aa2_100%)] border-[#6861e1] text-white hover:translate-y-[-1px]">Anwenden</button>
              <button type="button" onClick={() => { setSearch(''); setStatus(''); setCategory(''); }} className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 font-semibold transition-all duration-200 bg-[#171a2b] border-[#2a2f45] text-[#d6dbf0]">Zurücksetzen</button>
            </div>
          </form>
        </div>

        {/* Mittlere Spalte: Liste */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-[#2a2f45] bg-[#131625]">
            <div className="px-5 py-4 border-b border-[#212131] flex items-center justify-between">
              <h2 className="text-white font-semibold">Tickets</h2>
              {loadingList && <span className="text-[0.8rem] text-[#8a90ad]">Laden…</span>}
            </div>
            <div className="p-3 space-y-2 max-h-[60vh] overflow-y-auto">
              {tickets.map((t) => (
                <button key={t.id} onClick={() => setSelected(t)} className={cn('w-full text-left p-3 rounded-xl border transition-colors', selected?.id === t.id ? 'border-astra-purple/40 bg-astra-purple/10' : 'border-[#2a2f45] bg-[#131625] hover:bg-[#171a2b] hover:border-astra-purple/40')}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[#d6dbf0] font-medium truncate">{t.subject}</p>
                      <p className="text-[#9ca2bd] text-[0.78rem] truncate">{t.user_name} • {t.category}</p>
                    </div>
                    <span className={cn('px-2 py-1 rounded-md text-[0.72rem] border shrink-0',
                      t.status === 'open' && 'border-[#35406a] bg-[#171e33] text-[#a5c0ff]',
                      t.status === 'in_progress' && 'border-[#5b4cc8]/40 bg-astra-purple/10 text-[#c4b5fd]',
                      t.status === 'resolved' && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
                      t.status === 'closed' && 'border-[#3a3f59] bg-[#161a2d] text-[#8a90ad]'
                    )}>{t.status}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#8a90ad] text-[0.72rem] mt-1.5">
                    <span>#{t.ticket_number}</span>
                    <span>•</span>
                    <span>Aktualisiert {new Date(t.updated_at).toLocaleString('de-DE')}</span>
                  </div>
                </button>
              ))}
              {tickets.length === 0 && (
                <div className="text-center text-[#9ca2bd] py-6">Keine Tickets gefunden.</div>
              )}
            </div>
          </div>
        </div>

        {/* Rechte Spalte: Detail/Antwort/Status */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-[#2a2f45] bg-[#131625] min-h-[60vh]">
            <div className="px-5 py-4 border-b border-[#212131]">
              <h2 className="text-white font-semibold">Details</h2>
            </div>
            {!selected ? (
              <div className="p-5 text-[#9ca2bd]">Bitte ein Ticket aus der Liste auswählen.</div>
            ) : !detail ? (
              <div className="p-5 text-[#8a90ad]">Laden…</div>
            ) : (
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-white font-semibold truncate">{detail.subject}</p>
                    <p className="text-[#9ca2bd] text-[0.85rem] truncate">#{detail.ticket_number} • {detail.user_name} • {detail.category}</p>
                  </div>
                  <select value={detail.status} onChange={(e) => handleSetStatus(detail.id, e.target.value as TicketStatus)} className="h-9 rounded-lg bg-[#0f1220] border border-[#2a2f45] px-3 text-white focus:outline-none focus:border-astra-purple/40">
                    <option value="open">open</option>
                    <option value="in_progress">in_progress</option>
                    <option value="resolved">resolved</option>
                    <option value="closed">closed</option>
                  </select>
                </div>

                <div className="space-y-3 max-h-[36vh] overflow-y-auto pr-1">
                  {detail.messages.map((m) => (
                    <div key={m.id} className={cn('rounded-xl border p-3', m.is_admin ? 'border-[#5b4cc8]/40 bg-astra-purple/10' : 'border-[#2a2f45] bg-[#0f1220]')}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={cn('text-[0.86rem] font-medium', m.is_admin ? 'text-[#c4b5fd]' : 'text-[#d6dbf0]')}>{m.author_name}</span>
                        <span className="text-[0.76rem] text-[#8a90ad]">{new Date(m.created_at).toLocaleString('de-DE')}</span>
                      </div>
                      <p className="text-[0.95rem] text-[#d6dbf0] whitespace-pre-wrap leading-relaxed">{m.message}</p>
                    </div>
                  ))}
                </div>

                {detail.status === 'closed' ? (
                  <div className="text-[#8a90ad] text-[0.9rem]">Ticket ist geschlossen.</div>
                ) : (
                  <form onSubmit={handleReply} className="space-y-2">
                    <label className="block text-[0.82rem] text-[#8a90ad]">Antwort</label>
                    <textarea value={reply} onChange={(e) => setReply(e.target.value)} className="w-full min-h-24 rounded-lg bg-[#0f1220] border border-[#2a2f45] px-3 py-2 text-white placeholder:text-[#596189] focus:outline-none focus:border-astra-purple/40" />
                    <button disabled={sending || !reply.trim()} className={cn('inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 font-semibold transition-all duration-200', sending || !reply.trim() ? 'bg-[#171a2b] border-[#2a2f45] text-[#8a90ad] cursor-not-allowed' : 'bg-[linear-gradient(138deg,#6460e6_0%,#4b46c8_58%,#3e3aa2_100%)] border-[#6861e1] text-white hover:translate-y-[-1px]')}>{sending ? 'Sende…' : 'Antwort senden'}</button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminTicketsPage;
