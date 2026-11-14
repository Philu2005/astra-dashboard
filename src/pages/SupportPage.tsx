import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supportApi } from '@/services/support-api';
import type { TicketSummary, TicketCreate, TicketDetail } from '@/types/support';
import { SUPPORT_CATEGORIES, STATUS_LABELS, PRIORITY_LABELS } from '@/types/support';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { StaticInfoPage } from '@/pages/StaticInfoPage';
import { cn } from '@/lib/utils';
import { CharCounter } from '@/components/support/CharCounter';
import { AstraSelectMenu } from '@/components/ui/AstraSelectMenu';
import { useTicketMessagesPolling } from '@/hooks/useTicketMessagesPolling';
import { MessageList } from '@/components/support/MessageList';

export const SupportPage: React.FC = () => {
  const { authenticated, loading, user } = useAuth();
  const [tickets, setTickets] = useState<TicketSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<TicketSummary | null>(null);
  const [detail, setDetail] = useState<TicketDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [reopening, setReopening] = useState(false);

  const [form, setForm] = useState<TicketCreate>({ subject: '', category: SUPPORT_CATEGORIES[0], description: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);

  const SUBJECT_MAX = 200;
  const DESCRIPTION_MAX = 8000;
  const SUBJECT_WARN = 20;
  const DESCRIPTION_WARN = 200;

  const getCurrentMessages = useCallback(() => detail?.messages ?? [], [detail]);
  const handleUpdate = useCallback((updated: TicketDetail) => {
    setDetail(updated);
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

  const { activeTickets, resolvedTickets, counters } = useMemo(() => {
    const list = tickets ?? [];
    const active = list.filter((t) => t.status !== 'resolved');
    const resolved = list.filter((t) => t.status === 'resolved');
    return {
      activeTickets: active,
      resolvedTickets: resolved,
      counters: {
        total: list.length,
        open: list.filter((t) => t.status === 'open').length,
        in_progress: list.filter((t) => t.status === 'in_progress').length,
        resolved: resolved.length,
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
      setForm({ subject: '', category: SUPPORT_CATEGORIES[0], description: '' });
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
      setTickets((prev) => prev ? prev.map((t) => (t.id === updated.id ? { ...t, updated_at: updated.updated_at, status: updated.status } : t)) : prev);
    } catch (e: any) {
      setError(e.message || 'Antwort konnte nicht gesendet werden');
    } finally {
      setSending(false);
    }
  };

  const handleReopen = async () => {
    if (!detail) return;
    try {
      setReopening(true);
      const updated = await supportApi.reopenTicket(detail.id);
      setDetail(updated);
      setTickets((prev) => prev ? prev.map((t) => (t.id === updated.id ? { ...t, status: updated.status, updated_at: updated.updated_at } : t)) : prev);
    } catch (e: any) {
      setError(e.message || 'Ticket konnte nicht wieder geöffnet werden');
    } finally {
      setReopening(false);
    }
  };

  if (!authenticated && !loading) {
    return (
      <StaticInfoPage title="Nicht angemeldet" description="Bitte melde dich an, um den Support zu nutzen." showHomeActions />
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 2xl:max-w-[1680px] h-full flex flex-col min-h-0">
        {/* Hero / Header */}
        <div className="mb-6 rounded-2xl border border-[#2a2f45] bg-[#0f1220] overflow-hidden shadow-[0_0_0_1px_rgba(104,97,225,0.08),0_30px_60px_-20px_rgba(0,0,0,0.45)] shrink-0">
          <div className="relative px-6 py-6 md:px-8 md:py-7">
            <div className="absolute inset-0 pointer-events-none opacity-70 bg-[radial-gradient(1200px_300px_at_10%_-20%,rgba(125,227,255,0.12)_0%,rgba(125,227,255,0)_60%),radial-gradient(900px_220px_at_80%_-30%,rgba(75,70,200,0.18)_0%,rgba(75,70,200,0)_55%)]" />
            <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <h1 className="text-white text-3xl font-bold tracking-tight">Wie können wir dir helfen?</h1>
                <p className="text-[#9ca2bd] mt-1 max-w-3xl">
                  Unser Support antwortet in der Regel innerhalb weniger Minuten. Stelle ein Ticket ein oder verwalte deine laufenden Anfragen.
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
            <StatCard label="In Bearbeitung" value={counters.in_progress} accent="indigo" loading={loading || loadingList} />
            <StatCard label="Gelöst" value={counters.resolved} accent="emerald" loading={loading || loadingList} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] xl:grid-cols-[3fr_1.4fr] gap-6 flex-1 min-h-0 lg:grid-rows-[1fr]">
          {/* Linke Spalte: eigene Tickets */}
          <div className="lg:h-full lg:min-h-0 lg:overflow-y-auto scrollbar-hide">
            {/* Aktive Tickets */}
            <div className="rounded-2xl border border-[#2a2f45] bg-[#131625] shadow-[0_0_0_1px_rgba(104,97,225,0.08),0_30px_60px_-20px_rgba(0,0,0,0.45)]">
              <div className="px-5 py-4 border-b border-[#212131] flex items-center justify-between bg-[linear-gradient(180deg,rgba(75,70,200,0.08)_0%,rgba(75,70,200,0)_100%)]">
                <h2 className="text-white font-semibold">Offene Tickets</h2>
                <div className="flex items-center gap-3">
                  <span className="text-[0.8rem] text-[#8a90ad]">{activeTickets.length}</span>
                  {(loading || loadingList) && <span className="text-[0.8rem] text-[#8a90ad]">Laden…</span>}
                </div>
              </div>
              <div className="p-3">
                {error && <div className="mb-3 text-[0.9rem] text-red-400">{error}</div>}
                {!loadingList && activeTickets.length === 0 && (
                  <div className="p-6 text-center text-[#9ca2bd]">Keine offenen Tickets.</div>
                )}
                <div className="space-y-2">
                  {activeTickets.map((t) => (
                    <TicketRow key={t.id} t={t} active={selected?.id === t.id} onClick={() => setSelected(t)} />
                  ))}
                </div>
              </div>
            </div>

            {/* Abgeschlossene Tickets */}
            <div className="mt-6 rounded-2xl border border-[#2a2f45] bg-[#0f1220] shadow-[0_0_0_1px_rgba(104,97,225,0.04),0_30px_60px_-30px_rgba(0,0,0,0.45)]">
              <div className="px-5 py-3 border-b border-[#212131] flex items-center justify-between">
                <h3 className="text-white/90 font-semibold">Abgeschlossene Tickets</h3>
                <span className="text-[0.8rem] text-[#8a90ad]">{resolvedTickets.length}</span>
              </div>
              <div className="p-3">
                {!loadingList && resolvedTickets.length === 0 && (
                  <div className="p-6 text-center text-[#9ca2bd]">Noch keine abgeschlossenen Tickets.</div>
                )}
                <div className="space-y-2">
                  {resolvedTickets.map((t) => (
                    <TicketRow key={t.id} t={t} active={selected?.id === t.id} onClick={() => setSelected(t)} subtle />
                  ))}
                </div>
              </div>
            </div>

            {/* Discord-Hinweis */}
            <div className="mt-6 rounded-2xl border border-[#5865F2]/30 bg-[linear-gradient(135deg,rgba(88,101,242,0.08)_0%,rgba(88,101,242,0.02)_100%)] shadow-[0_0_0_1px_rgba(88,101,242,0.1)] overflow-hidden">
              <div className="px-5 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#5865F2]/15 flex items-center justify-center shrink-0">
                  <svg className="w-7 h-7 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-[0.95rem]">Du brauchst schnelle Hilfe?</h3>
                  <p className="text-[#9ca2bd] text-[0.85rem] mt-0.5">Besuche unseren Astra Discord-Supportserver und tausche dich direkt mit der Community und dem Support aus.</p>
                </div>
                <a
                  href="https://discord.gg/DBpsrT2n5u"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 font-semibold transition-all duration-200 bg-[#5865F2]/15 border-[#5865F2]/40 text-[#8b9aff] hover:bg-[#5865F2]/25 hover:translate-y-[-1px] shrink-0"
                >
                  Discord-Support öffnen
                </a>
              </div>
            </div>
          </div>

          {/* Rechte Spalte: Detail oder Formular */}
          <div className="min-w-[360px] sm:min-w-0 lg:h-full lg:min-h-0 flex flex-col">
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
                      onChange={(e) => { if (e.target.value.length <= SUBJECT_MAX) setForm((p) => ({ ...p, subject: e.target.value })); }}
                      maxLength={SUBJECT_MAX}
                      className="w-full h-10 rounded-lg bg-[#0f1220] border border-[#2a2f45] px-3 text-white placeholder:text-[#596189] focus:outline-none focus:border-astra-purple/40"
                      placeholder="Kurze Zusammenfassung"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && !('ontouchstart' in window)) {
                          e.preventDefault();
                          const btn = formRef.current?.querySelector('button[type="submit"]') as HTMLButtonElement | null;
                          btn?.click();
                        }
                      }}
                    />
                    <CharCounter current={form.subject.length} max={SUBJECT_MAX} warn={SUBJECT_WARN} />
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
                      onChange={(e) => { if (e.target.value.length <= DESCRIPTION_MAX) setForm((p) => ({ ...p, description: e.target.value })); }}
                      maxLength={DESCRIPTION_MAX}
                      className="w-full min-h-32 rounded-lg bg-[#0f1220] border border-[#2a2f45] px-3 py-2 text-white placeholder:text-[#596189] focus:outline-none focus:border-astra-purple/40"
                      placeholder="Was ist passiert? Wie können wir es reproduzieren?"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && !('ontouchstart' in window)) {
                          e.preventDefault();
                          const btn = formRef.current?.querySelector('button[type="submit"]') as HTMLButtonElement | null;
                          btn?.click();
                        }
                      }}
                    />
                    <CharCounter current={form.description.length} max={DESCRIPTION_MAX} warn={DESCRIPTION_WARN} />
                  </div>
                  <button
                    type="submit"
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
              <div className="rounded-2xl border border-[#2a2f45] bg-[#131625] flex flex-col flex-1 min-h-0 shadow-[0_0_0_1px_rgba(104,97,225,0.08),0_30px_60px_-20px_rgba(0,0,0,0.45)]">
                <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-2 shrink-0">
                  <h2 className="text-white font-semibold">Ticketdetails</h2>
                  <button onClick={() => setSelected(null)} className="text-[#8a90ad] hover:text-[#d6dbf0] text-[0.9rem]">Zur Übersicht</button>
                </div>
                {detailLoading && <div className="text-[#8a90ad] px-5">Laden…</div>}
                {!detailLoading && !detail && <div className="text-[#9ca2bd] px-5">Ticket konnte nicht geladen werden.</div>}
                {detail && (
                  <>
                    <div className="flex items-center justify-between gap-4 px-5 pb-2 shrink-0">
                      <div className="min-w-0">
                        <p className="text-white font-semibold truncate">{detail.subject}</p>
                        <p className="text-[#9ca2bd] text-[0.85rem] truncate">#{detail.ticket_number} • {detail.category}</p>
                      </div>
                      <StatusBadge status={detail.status} />
                    </div>
                    <MessageList messages={detail.messages} currentUserId={user?.id ?? null} adminView={false} ticket={detail} />
                    <div className="px-5 pb-5 pt-2 shrink-0">
                      {detail.status === 'resolved' ? (
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
                            value={reply}
                            onChange={(e) => { if (e.target.value.length <= 8000) setReply(e.target.value); }}
                            maxLength={8000}
                            className="w-full min-h-24 rounded-lg bg-[#0f1220] border border-[#2a2f45] px-3 py-2 text-white placeholder:text-[#596189] focus:outline-none focus:border-astra-purple/40"
                            placeholder="Schreibe deine Nachricht…"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey && !('ontouchstart' in window)) {
                                e.preventDefault();
                                if (reply.trim() && !sending) handleReply(e as unknown as React.FormEvent);
                              }
                            }}
                          />
                          <CharCounter current={reply.length} max={8000} warn={200} />
                          <button disabled={sending || !reply.trim()} className={cn('inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 font-semibold transition-all duration-200', sending || !reply.trim() ? 'bg-[#171a2b] border-[#2a2f45] text-[#8a90ad] cursor-not-allowed' : 'bg-[linear-gradient(138deg,#6460e6_0%,#4b46c8_58%,#3e3aa2_100%)] border-[#6861e1] text-white hover:translate-y-[-1px]')}>{sending ? 'Sende…' : 'Antwort senden'}</button>
                        </form>
                      )}
                    </div>
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

// --- Hilfskomponenten ---

const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span className={cn('px-2 py-1 rounded-md text-[0.72rem] border',
    status === 'open' && 'border-[#35406a] bg-[#171e33] text-[#a5c0ff]',
    status === 'in_progress' && 'border-[#5b4cc8]/40 bg-astra-purple/10 text-[#c4b5fd]',
    status === 'resolved' && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  )}>{STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status}</span>
);

const StatCard: React.FC<{ label: string; value: number; accent?: 'cyan' | 'purple' | 'indigo' | 'emerald'; loading?: boolean }> = ({ label, value, accent = 'cyan', loading }) => {
  const accentStyles = {
    cyan: 'bg-[linear-gradient(180deg,rgba(125,227,255,0.12)_0%,rgba(125,227,255,0)_100%)] border-cyan-400/20',
    purple: 'bg-[linear-gradient(180deg,rgba(75,70,200,0.12)_0%,rgba(75,70,200,0)_100%)] border-astra-purple/30',
    indigo: 'bg-[linear-gradient(180deg,rgba(99,102,241,0.12)_0%,rgba(99,102,241,0)_100%)] border-indigo-400/20',
    emerald: 'bg-[linear-gradient(180deg,rgba(16,185,129,0.12)_0%,rgba(16,185,129,0)_100%)] border-emerald-400/20',
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
      <StatusBadge status={t.status} />
    </button>
  );
};
