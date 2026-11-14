import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supportApi } from '@/services/support-api';
import type { TicketSummary, TicketCreate, TicketDetail } from '@/types/support';
import { SUPPORT_CATEGORIES } from '@/types/support';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { StaticInfoPage } from '@/pages/StaticInfoPage';
import { cn } from '@/lib/utils';
import { AstraSelect } from '@/components/ui/AstraSelect';
import { AstraSelectMenu } from '@/components/ui/AstraSelectMenu';
import { useTicketMessagesPolling } from '@/hooks/useTicketMessagesPolling';

export const SupportPage: React.FC = () => {
  const { authenticated, loading } = useAuth();
  const [tickets, setTickets] = useState<TicketSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<TicketSummary | null>(null);
  const [detail, setDetail] = useState<TicketDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const [form, setForm] = useState<TicketCreate>({ subject: '', category: SUPPORT_CATEGORIES[0], description: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);

  // Polling neuer Nachrichten, solange in dieser Seite ein Ticket offen ist
  const getCurrentMessages = useCallback(() => detail?.messages ?? [], [detail]);
  const handleUpdate = useCallback((updated: TicketDetail) => {
    setDetail(updated);
    // Liste (updated_at, status) synchron halten
    setTickets((prev) => prev ? prev.map((t) => (t.id === updated.id ? { ...t, updated_at: updated.updated_at, status: updated.status } : t)) : prev);
  }, []);
  useTicketMessagesPolling(detail?.id ?? null, { intervalMs: 4500, onUpdate: handleUpdate, getCurrentMessages });

  useEffect(() => {
    if (!authenticated) return;
    let mounted = true;
    setLoadingList(true);
    supportApi
      .listMyTickets({ limit: 100 })
      .then((list) => {
        if (!mounted) return;
        setTickets(list);
        setError(null);
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e.message || 'Tickets konnten nicht geladen werden');
      })
      .finally(() => mounted && setLoadingList(false));
    return () => { mounted = false };
  }, [authenticated]);

  useEffect(() => {
    if (!selected) { setDetail(null); return; }
    let mounted = true;
    setDetailLoading(true);
    supportApi.getTicket(selected.id)
      .then((d) => { if (mounted) setDetail(d); })
      .catch(() => { if (mounted) setDetail(null); })
      .finally(() => { if (mounted) setDetailLoading(false); });
    return () => { mounted = false };
  }, [selected]);

  // Abgeleitete Daten: Aufteilung und Kennzahlen
  const { openTickets, closedTickets, counters } = useMemo(() => {
    const list = tickets ?? [];
    const open = list.filter((t) => t.status !== 'closed');
    const closed = list.filter((t) => t.status === 'closed');
    return {
      openTickets: open,
      closedTickets: closed,
      counters: {
        total: list.length,
        open: open.length,
        closed: closed.length,
        in_progress: list.filter((t) => t.status === 'in_progress').length,
        resolved: list.filter((t) => t.status === 'resolved').length,
      },
    } as const;
  }, [tickets]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.subject || form.subject.trim().length < 5) {
      setFormError('Bitte einen Betreff mit mindestens 5 Zeichen angeben.');
      return;
    }
    if (!form.description || form.description.trim().length < 10) {
      setFormError('Bitte eine Beschreibung mit mindestens 10 Zeichen angeben.');
      return;
    }
    try {
      setCreating(true);
      const created = await supportApi.createTicket(form);
      // Prepend created ticket to list
      setTickets((prev) => prev ? [
        {
          id: created.id,
          ticket_number: created.ticket_number,
          user_id: created.user_id,
          user_name: created.user_name,
          subject: created.subject,
          category: created.category,
          status: created.status,
          priority: created.priority,
          created_at: created.created_at,
          updated_at: created.updated_at,
        },
        ...prev,
      ] : prev);
      // Reset form
      setForm({ subject: '', category: SUPPORT_CATEGORIES[0], description: '' });
      // Direkt öffnen, ohne Seitenreload
      setSelected({
        id: created.id,
        ticket_number: created.ticket_number,
        user_id: created.user_id,
        user_name: created.user_name,
        subject: created.subject,
        category: created.category,
        status: created.status,
        priority: created.priority,
        created_at: created.created_at,
        updated_at: created.updated_at,
      });
    } catch (e: any) {
      setFormError(e.message || 'Ticket konnte nicht erstellt werden.');
    } finally {
      setCreating(false);
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
      // aktualisiere Liste-Zeitstempel
      setTickets((prev) => prev ? prev.map((t) => (t.id === updated.id ? { ...t, updated_at: updated.updated_at, status: updated.status } : t)) : prev);
    } catch (e: any) {
      setError(e.message || 'Antwort konnte nicht gesendet werden');
    } finally {
      setSending(false);
    }
  };

  // WICHTIG: Kein globaler Side Loader mehr – wir behalten das Layout bei und zeigen lokale Ladeinfos
  if (!authenticated && !loading) {
    return (
      <StaticInfoPage title="Nicht angemeldet" description="Bitte melde dich an, um den Support zu nutzen." showHomeActions />
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 2xl:max-w-[1680px]">
        {/* Hero / Header */}
        <div className="mb-6 rounded-2xl border border-[#2a2f45] bg-[#0f1220] overflow-hidden shadow-[0_0_0_1px_rgba(104,97,225,0.08),0_30px_60px_-20px_rgba(0,0,0,0.45)]">
          <div className="relative px-6 py-6 md:px-8 md:py-7">
            <div className="absolute inset-0 pointer-events-none opacity-70 bg-[radial-gradient(1200px_300px_at_10%_-20%,rgba(125,227,255,0.12)_0%,rgba(125,227,255,0)_60%),radial-gradient(900px_220px_at_80%_-30%,rgba(75,70,200,0.18)_0%,rgba(75,70,200,0)_55%)]" />
            <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <h1 className="text-white text-3xl font-bold tracking-tight">Wie können wir dir helfen?</h1>
                <p className="text-[#9ca2bd] mt-1 max-w-3xl">
                  Unser Support antwortet in der Regel innerhalb weniger Minuten. Stelle ein Ticket ein oder verwalte deine laufenden Anfragen.
                  Die Dokumentation findest du unter <a className="text-astra-cyan hover:underline" href="/docs">/docs</a>.
                </p>
              </div>
              <div className="shrink-0">
                <button
                  onClick={() => {
                    setSelected(null);
                    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 font-semibold transition-all duration-200 bg-[linear-gradient(138deg,#6460e6_0%,#4b46c8_58%,#3e3aa2_100%)] border-[#6861e1] text-white hover:translate-y-[-1px]"
                >
                  Neues Ticket
                </button>
              </div>
            </div>
          </div>
          {/* Kennzahlen */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-6 md:px-8 pb-6">
            <StatCard label="Gesamt" value={counters.total} accent="cyan" loading={loading || loadingList} />
            <StatCard label="Offen" value={counters.open} accent="purple" loading={loading || loadingList} />
            <StatCard label="In Arbeit" value={counters.in_progress} accent="indigo" loading={loading || loadingList} />
            <StatCard label="Geschlossen" value={counters.closed} accent="slate" loading={loading || loadingList} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] xl:grid-cols-[3fr_1.4fr] gap-6 items-start">
          {/* Linke Spalte: eigene Tickets */}
          <div>
            {/* Offen & in Arbeit */}
            <div className="rounded-2xl border border-[#2a2f45] bg-[#131625] shadow-[0_0_0_1px_rgba(104,97,225,0.08),0_30px_60px_-20px_rgba(0,0,0,0.45)]">
              <div className="px-5 py-4 border-b border-[#212131] flex items-center justify-between bg-[linear-gradient(180deg,rgba(75,70,200,0.08)_0%,rgba(75,70,200,0)_100%)]">
                <h2 className="text-white font-semibold">Offene Tickets</h2>
                <div className="flex items-center gap-3">
                  <span className="text-[0.8rem] text-[#8a90ad]">{openTickets.length}</span>
                  {(loading || loadingList) && <span className="text-[0.8rem] text-[#8a90ad]">Laden…</span>}
                </div>
              </div>
              <div className="p-3">
                {error && <div className="mb-3 text-[0.9rem] text-red-400">{error}</div>}
                {!loadingList && openTickets.length === 0 && (
                  <div className="p-6 text-center text-[#9ca2bd]">Keine offenen Tickets.</div>
                )}
                <div className="space-y-2">
                  {openTickets.map((t) => (
                    <TicketRow key={t.id} t={t} active={selected?.id === t.id} onClick={() => setSelected(t)} />
                  ))}
                </div>
              </div>
            </div>

            {/* Geschlossen */}
            <div className="mt-6 rounded-2xl border border-[#2a2f45] bg-[#0f1220] shadow-[0_0_0_1px_rgba(104,97,225,0.04),0_30px_60px_-30px_rgba(0,0,0,0.45)]">
              <div className="px-5 py-3 border-b border-[#212131] flex items-center justify-between">
                <h3 className="text-white/90 font-semibold">Geschlossene Tickets</h3>
                <span className="text-[0.8rem] text-[#8a90ad]">{closedTickets.length}</span>
              </div>
              <div className="p-3">
                {!loadingList && closedTickets.length === 0 && (
                  <div className="p-6 text-center text-[#9ca2bd]">Noch keine geschlossenen Tickets.</div>
                )}
                <div className="space-y-2">
                  {closedTickets.map((t) => (
                    <TicketRow key={t.id} t={t} active={selected?.id === t.id} onClick={() => setSelected(t)} subtle />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Rechte Spalte: Detail oder Formular */}
          <div className="min-w-[360px] sm:min-w-0">
            {!selected ? (
              <div ref={formRef} className="rounded-2xl border border-[#2a2f45] bg-[#131625] p-5 shadow-[0_0_0_1px_rgba(104,97,225,0.08),0_30px_60px_-20px_rgba(0,0,0,0.45)]">
                <h2 className="text-white font-semibold mb-1">Neues Ticket</h2>
                <p className="text-[#9ca2bd] text-[0.9rem] mb-4">Beschreibe dein Anliegen möglichst präzise, damit wir dir schneller helfen können.</p>
                {formError && (
                  <div className="mb-3 text-[0.9rem] text-red-400">{formError}</div>
                )}
                <form onSubmit={handleCreate} className="space-y-3">
                  <div>
                    <label className="block text-[0.82rem] text-[#8a90ad] mb-1">Betreff</label>
                    <input
                      value={form.subject}
                      onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                      className="w-full h-10 rounded-lg bg-[#0f1220] border border-[#2a2f45] px-3 text-white placeholder:text-[#596189] focus:outline-none focus:border-astra-purple/40"
                      placeholder="Kurze Zusammenfassung"
                    />
                  </div>
                  <div>
                    <label className="block text-[0.82rem] text-[#8a90ad] mb-1">Kategorie</label>
                    <AstraSelectMenu
                      value={form.category}
                      onChange={(v) => setForm((p) => ({ ...p, category: v }))}
                      items={SUPPORT_CATEGORIES.map((c) => ({ value: c, label: c }))}
                      aria-label="Kategorie auswählen"
                    />
                  </div>
                  <div>
                    <label className="block text-[0.82rem] text-[#8a90ad] mb-1">Beschreibung</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                      className="w-full min-h-32 rounded-lg bg-[#0f1220] border border-[#2a2f45] px-3 py-2 text-white placeholder:text-[#596189] focus:outline-none focus:border-astra-purple/40"
                      placeholder="Was ist passiert? Wie können wir es reproduzieren?"
                    />
                  </div>
                  <button
                    disabled={creating}
                    className={cn(
                      "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 font-semibold transition-all duration-200",
                      creating
                        ? 'bg-[#171a2b] border-[#2a2f45] text-[#8a90ad] cursor-wait'
                        : 'bg-[linear-gradient(138deg,#6460e6_0%,#4b46c8_58%,#3e3aa2_100%)] border-[#6861e1] text-white hover:translate-y-[-1px]'
                    )}
                  >
                    {creating ? 'Erstelle…' : 'Ticket erstellen'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#2a2f45] bg-[#131625] p-5 min-h-[40vh] shadow-[0_0_0_1px_rgba(104,97,225,0.08),0_30px_60px_-20px_rgba(0,0,0,0.45)]">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h2 className="text-white font-semibold">Ticketdetails</h2>
                  <button onClick={() => setSelected(null)} className="text-[#8a90ad] hover:text-[#d6dbf0] text-[0.9rem]">Zur Übersicht</button>
                </div>
                {detailLoading && <div className="text-[#8a90ad]">Laden…</div>}
                {!detailLoading && !detail && <div className="text-[#9ca2bd]">Ticket konnte nicht geladen werden.</div>}
                {detail && (
                  <>
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-white font-semibold truncate">{detail.subject}</p>
                        <p className="text-[#9ca2bd] text-[0.85rem] truncate">#{detail.ticket_number} • {detail.category}</p>
                      </div>
                      <span className={cn('px-2 py-1 rounded-md text-[0.72rem] border',
                        detail.status === 'open' && 'border-[#35406a] bg-[#171e33] text-[#a5c0ff]',
                        detail.status === 'in_progress' && 'border-[#5b4cc8]/40 bg-astra-purple/10 text-[#c4b5fd]',
                        detail.status === 'resolved' && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
                        detail.status === 'closed' && 'border-[#3a3f59] bg-[#161a2d] text-[#8a90ad]'
                      )}>{detail.status}</span>
                    </div>
                    <div className="mt-3 space-y-3 max-h-[42vh] overflow-y-auto pr-1">
                      {detail.messages.map((m) => (
                        <div key={m.id} className={cn('flex', m.is_admin ? 'justify-end' : 'justify-start')}>
                          <div className={cn('max-w-[88%] rounded-2xl border p-3', m.is_admin ? 'border-[#5b4cc8]/40 bg-astra-purple/10' : 'border-[#2a2f45] bg-[#0f1220]')}>
                            <div className="flex items-center justify-between mb-1.5 gap-3">
                              <span className={cn('text-[0.86rem] font-medium', m.is_admin ? 'text-[#c4b5fd]' : 'text-[#d6dbf0]')}>{m.author_name}{m.is_admin && ' • Support'}</span>
                              <span className="text-[0.76rem] text-[#8a90ad] whitespace-nowrap">{new Date(m.created_at).toLocaleString('de-DE')}</span>
                            </div>
                            <p className="text-[0.95rem] text-[#d6dbf0] whitespace-pre-wrap leading-relaxed">{m.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {detail.status === 'closed' ? (
                      <div className="text-[#8a90ad] text-[0.9rem] mt-3">Ticket ist geschlossen.</div>
                    ) : (
                      <form onSubmit={handleReply} className="space-y-2 mt-3">
                        <label className="block text-[0.82rem] text-[#8a90ad]">Antwort</label>
                        <textarea value={reply} onChange={(e) => setReply(e.target.value)} className="w-full min-h-24 rounded-lg bg-[#0f1220] border border-[#2a2f45] px-3 py-2 text-white placeholder:text-[#596189] focus:outline-none focus:border-astra-purple/40" />
                        <button disabled={sending || !reply.trim()} className={cn('inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 font-semibold transition-all duration-200', sending || !reply.trim() ? 'bg-[#171a2b] border-[#2a2f45] text-[#8a90ad] cursor-not-allowed' : 'bg-[linear-gradient(138deg,#6460e6_0%,#4b46c8_58%,#3e3aa2_100%)] border-[#6861e1] text-white hover:translate-y-[-1px]')}>{sending ? 'Sende…' : 'Antwort senden'}</button>
                      </form>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SupportPage;

// Kleine UI-Hilfskomponenten innerhalb dieser Datei, um Abhängigkeiten gering zu halten
const StatCard: React.FC<{ label: string; value: number; accent?: 'cyan' | 'purple' | 'indigo' | 'slate'; loading?: boolean }> = ({ label, value, accent = 'slate', loading }) => {
  const accentStyles = {
    cyan: 'bg-[linear-gradient(180deg,rgba(125,227,255,0.12)_0%,rgba(125,227,255,0)_100%)] border-cyan-400/20',
    purple: 'bg-[linear-gradient(180deg,rgba(75,70,200,0.12)_0%,rgba(75,70,200,0)_100%)] border-astra-purple/30',
    indigo: 'bg-[linear-gradient(180deg,rgba(99,102,241,0.12)_0%,rgba(99,102,241,0)_100%)] border-indigo-400/20',
    slate: 'bg-[linear-gradient(180deg,rgba(148,163,184,0.10)_0%,rgba(148,163,184,0)_100%)] border-slate-400/20',
  } as const;
  return (
    <div className={cn('rounded-xl border p-3', accentStyles[accent])}>
      <div className="text-[0.82rem] text-[#9ca2bd]">{label}</div>
      <div className="mt-1 text-white text-2xl font-semibold tabular-nums">{loading ? '—' : value}</div>
    </div>
  );
};

const TicketRow: React.FC<{
  t: TicketSummary;
  active?: boolean;
  subtle?: boolean;
  onClick?: () => void;
}> = ({ t, active, subtle, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200',
        active
          ? 'border-astra-purple/40 bg-astra-purple/10 shadow-[inset_0_0_0_1px_rgba(125,227,255,0.08)]'
          : cn(
              subtle
                ? 'border-[#22263a] bg-[#0f1220] hover:bg-[#121626]'
                : 'border-[#2a2f45] bg-[#131625] hover:bg-[#171a2b] hover:border-astra-purple/40 hover:shadow-[0_0_0_1px_rgba(125,227,255,0.06)]'
            )
      )}
    >
      <div className="w-10 h-10 rounded-lg bg-[#171a2b] flex items-center justify-center text-[#8a90ad] text-[0.76rem] font-mono">
        {t.ticket_number.slice(-4)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-[0.95rem] text-[#d6dbf0] font-medium truncate">{t.subject}</p>
          <span className="text-[0.75rem] text-[#8a90ad] shrink-0">#{t.ticket_number}</span>
        </div>
        <p className="text-[0.8rem] text-[#9ca2bd] truncate">
          {t.category} • Erstellt {new Date(t.created_at).toLocaleDateString('de-DE')} • Letzte Aktivität {new Date(t.updated_at).toLocaleString('de-DE')}
        </p>
      </div>
      <span
        className={cn(
          'px-2 py-1 rounded-md text-[0.72rem] border shrink-0',
          t.status === 'open' && 'border-[#35406a] bg-[#171e33] text-[#a5c0ff]',
          t.status === 'in_progress' && 'border-[#5b4cc8]/40 bg-astra-purple/10 text-[#c4b5fd]',
          t.status === 'resolved' && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
          t.status === 'closed' && 'border-[#3a3f59] bg-[#161a2d] text-[#8a90ad]'
        )}
      >
        {t.status}
      </span>
    </button>
  );
};
