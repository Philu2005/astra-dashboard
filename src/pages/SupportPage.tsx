import React, { useEffect, useMemo, useState } from 'react';
import { supportApi } from '@/services/support-api';
import type { TicketSummary, TicketCreate, TicketDetail } from '@/types/support';
import { SUPPORT_CATEGORIES } from '@/types/support';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { StaticInfoPage } from '@/pages/StaticInfoPage';
import { cn } from '@/lib/utils';
import { AstraSelect } from '@/components/ui/AstraSelect';

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

  if (loading) {
    return (
      <StaticInfoPage title="Wird geladen..." description="Deine Sitzung wird überprüft." />
    );
  }
  if (!authenticated) {
    return (
      <StaticInfoPage title="Nicht angemeldet" description="Bitte melde dich an, um den Support zu nutzen." showHomeActions />
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 2xl:max-w-[1680px]">
        <div className="mb-6">
          <h1 className="text-white text-3xl font-bold">Wie können wir dir helfen?</h1>
          <p className="text-[#9ca2bd] mt-1">Erstelle ein neues Ticket oder verwalte deine bisherigen Anfragen. Die Dokumentation findest du unter <a className="text-astra-cyan hover:underline" href="/docs">/docs</a>.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] xl:grid-cols-[3fr_1.4fr] gap-6 items-start">
          {/* Linke Spalte: eigene Tickets */}
          <div>
            <div className="rounded-2xl border border-[#2a2f45] bg-[#131625]">
              <div className="px-5 py-4 border-b border-[#212131] flex items-center justify-between">
                <h2 className="text-white font-semibold">Deine Tickets</h2>
                {loadingList && <span className="text-[0.8rem] text-[#8a90ad]">Laden…</span>}
              </div>
              <div className="p-3">
                {error && (
                  <div className="mb-3 text-[0.9rem] text-red-400">{error}</div>
                )}
                {!loadingList && (tickets?.length ?? 0) === 0 && (
                  <div className="p-6 text-center text-[#9ca2bd]">Du hast noch keine Support-Tickets erstellt.</div>
                )}
                <div className="space-y-2">
                  {tickets?.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelected(t)}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200",
                        selected?.id === t.id
                          ? 'border-astra-purple/40 bg-astra-purple/10'
                          : 'border-[#2a2f45] bg-[#131625] hover:bg-[#171a2b] hover:border-astra-purple/40'
                      )}
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#171a2b] flex items-center justify-center text-[#8a90ad] text-[0.76rem] font-mono">
                        {t.ticket_number.slice(-4)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[0.95rem] text-[#d6dbf0] font-medium truncate">{t.subject}</p>
                        <p className="text-[0.8rem] text-[#9ca2bd] truncate">{t.category} • Letzte Aktivität {new Date(t.updated_at).toLocaleString('de-DE')}</p>
                      </div>
                      <span className={cn(
                        "px-2 py-1 rounded-md text-[0.72rem] border",
                        t.status === 'open' && 'border-[#35406a] bg-[#171e33] text-[#a5c0ff]',
                        t.status === 'in_progress' && 'border-[#5b4cc8]/40 bg-astra-purple/10 text-[#c4b5fd]',
                        t.status === 'resolved' && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
                        t.status === 'closed' && 'border-[#3a3f59] bg-[#161a2d] text-[#8a90ad]'
                      )}>
                        {t.status}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Rechte Spalte: Detail oder Formular */}
          <div className="min-w-[360px] sm:min-w-0">
            {!selected ? (
              <div className="rounded-2xl border border-[#2a2f45] bg-[#131625] p-5">
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
                    <AstraSelect
                      value={form.category}
                      onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                      aria-label="Kategorie auswählen"
                    >
                      {SUPPORT_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </AstraSelect>
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
              <div className="rounded-2xl border border-[#2a2f45] bg-[#131625] p-5 min-h-[40vh]">
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
