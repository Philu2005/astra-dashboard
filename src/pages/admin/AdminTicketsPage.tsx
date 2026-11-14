import React, { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { StaticInfoPage } from '@/pages/StaticInfoPage';
import { useAuth } from '@/contexts/AuthContext';
import { supportApi } from '@/services/support-api';
import type { TicketCounters, TicketDetail, TicketStatus, TicketSummary, TicketPriority, UserHistoryItem, UserInfo } from '@/types/support';
import { SUPPORT_CATEGORIES } from '@/types/support';
import { cn } from '@/lib/utils';
import { AstraSelect } from '@/components/ui/AstraSelect';
import { AstraSelectMenu } from '@/components/ui/AstraSelectMenu';
import { AstraConfirmDialog } from '@/components/ui/AstraConfirmDialog';
import { MessageList } from '@/components/support/MessageList';
import { useTicketMessagesPolling } from '@/hooks/useTicketMessagesPolling';

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
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | ''>('');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [userHistory, setUserHistory] = useState<UserHistoryItem[] | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoadingList(true);
      const [c, list] = await Promise.all([
        supportApi.counters(),
        supportApi.listAll({ status: status || undefined, category: category || undefined, priority: priorityFilter || undefined, search: search || undefined, limit: 100 }),
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
    // Nutzerinfo & Historie laden
    setUserInfo(null);
    setUserHistory(null);
    supportApi.getUserInfoForTicket(selected.id).then((info) => { if (mounted) setUserInfo(info); }).catch(() => {});
    supportApi.getUserHistoryForTicket(selected.id).then((hist) => { if (mounted) setUserHistory(hist); }).catch(() => {});
    return () => { mounted = false };
  }, [selected]);

  // Polling neuer Nachrichten für ausgewähltes Ticket
  useTicketMessagesPolling(detail?.id ?? null, {
    intervalMs: 4000,
    onUpdate: (updated) => setDetail(updated),
    getCurrentMessages: () => detail?.messages ?? [],
  });

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

  const handleSetPriority = async (ticketId: number, newPriority: TicketPriority) => {
    try {
      const updated = await supportApi.setPriority(ticketId, newPriority);
      setDetail(updated);
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, priority: updated.priority, updated_at: updated.updated_at } : t)));
    } catch (e: any) {
      setError(e.message || 'Priorität konnte nicht gesetzt werden');
    }
  };

  const confirmDelete = async () => {
    if (!detail) return;
    setDeleteError(null);
    try {
      setDeleting(true);
      await supportApi.deleteTicket(detail.id);
      setTickets((prev) => prev.filter((t) => t.id !== detail.id));
      setDetail(null);
      setSelected(null);
      setCounters(await supportApi.counters());
      setDeleteDialogOpen(false);
    } catch (e: any) {
      setDeleteError(e.message || 'Ticket konnte nicht gelöscht werden');
    } finally {
      setDeleting(false);
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

  // Kein globaler Side Loader in der Admin-Ansicht: Layout bleibt bestehen
  if ((!authenticated && !loading) || (!isAdmin && !loading)) {
    return <StaticInfoPage title="Kein Zugriff" description="Diese Seite ist nur für den Administrator verfügbar." showHomeActions />
  }

  return (
    <DashboardLayout>
      <div className="mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 2xl:max-w-[1800px] grid grid-cols-1 lg:grid-cols-[320px_1fr_1.6fr] xl:grid-cols-[340px_1.1fr_1.8fr] 2xl:grid-cols-[360px_1.2fr_2fr] gap-6 items-start">
        {/* Linke Spalte: Kennzahlen + Filter */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-[#2a2f45] bg-[#131625] p-5 shadow-[0_0_0_1px_rgba(104,97,225,0.08),0_30px_60px_-20px_rgba(0,0,0,0.45)]">
            <h2 className="text-white font-semibold mb-3">Übersicht</h2>
            {counters ? (
              <div className="grid grid-cols-2 gap-3 text-[0.95rem]">
                <div className="rounded-xl border border-[#2a2f45] bg-[#0f1220] p-3 shadow-[inset_0_0_0_1px_rgba(125,227,255,0.06)]"><div className="text-[#8a90ad]">Gesamt</div><div className="text-white text-xl font-bold">{counters.total}</div></div>
                <div className="rounded-xl border border-[#2a2f45] bg-[#0f1220] p-3 shadow-[inset_0_0_0_1px_rgba(125,227,255,0.06)]"><div className="text-[#8a90ad]">Offen</div><div className="text-white text-xl font-bold">{counters.open}</div></div>
                <div className="rounded-xl border border-[#2a2f45] bg-[#0f1220] p-3 shadow-[inset_0_0_0_1px_rgba(125,227,255,0.06)]"><div className="text-[#8a90ad]">In Bearbeitung</div><div className="text-white text-xl font-bold">{counters.in_progress}</div></div>
                <div className="rounded-xl border border-[#2a2f45] bg-[#0f1220] p-3 shadow-[inset_0_0_0_1px_rgba(125,227,255,0.06)]"><div className="text-[#8a90ad]">Gelöst</div><div className="text-white text-xl font-bold">{counters.resolved}</div></div>
                <div className="rounded-xl border border-[#2a2f45] bg-[#0f1220] p-3 col-span-2 shadow-[inset_0_0_0_1px_rgba(125,227,255,0.06)]"><div className="text-[#8a90ad]">Geschlossen</div><div className="text-white text-xl font-bold">{counters.closed}</div></div>
              </div>
            ) : error ? (
              <div className="text-red-400 text-[0.9rem]">{error}</div>
            ) : loadingList ? (
              <div className="text-[#8a90ad]">Laden…</div>
            ) : (
              <div className="text-[#8a90ad]">Keine Daten verfügbar.</div>
            )}
          </div>

          <form onSubmit={handleApplyFilters} className="rounded-2xl border border-[#2a2f45] bg-[#131625] p-5 space-y-3 shadow-[0_0_0_1px_rgba(104,97,225,0.08),0_30px_60px_-20px_rgba(0,0,0,0.45)]">
            <h2 className="text-white font-semibold">Filter</h2>
            <div>
              <label className="block text-[0.82rem] text-[#8a90ad] mb-1">Suche</label>
              <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full h-10 rounded-lg bg-[#0f1220] border border-[#2a2f45] px-3 text-white placeholder:text-[#596189] focus:outline-none focus:border-astra-purple/40" placeholder="Ticketnummer, Nutzer, Betreff" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[0.82rem] text-[#8a90ad] mb-1">Status</label>
                <AstraSelectMenu
                  value={status}
                  onChange={(v) => setStatus(v as TicketStatus | '')}
                  items={[
                    { value: '', label: 'Alle' },
                    { value: 'open', label: 'open' },
                    { value: 'in_progress', label: 'in_progress' },
                    { value: 'resolved', label: 'resolved' },
                    { value: 'closed', label: 'closed' },
                  ]}
                  aria-label="Status filtern"
                />
              </div>
              <div>
                <label className="block text-[0.82rem] text-[#8a90ad] mb-1">Kategorie</label>
                <AstraSelectMenu
                  value={category}
                  onChange={(v) => setCategory(v)}
                  items={[{ value: '', label: 'Alle' }, ...SUPPORT_CATEGORIES.map((c) => ({ value: c, label: c }))]}
                  aria-label="Kategorie filtern"
                />
              </div>
              <div>
                <label className="block text-[0.82rem] text-[#8a90ad] mb-1">Priorität</label>
                <AstraSelectMenu
                  value={priorityFilter}
                  onChange={(v) => setPriorityFilter(v as TicketPriority | '')}
                  items={[
                    { value: '', label: 'Alle' },
                    { value: 'low', label: 'low' },
                    { value: 'normal', label: 'normal' },
                    { value: 'high', label: 'high' },
                    { value: 'critical', label: 'critical' },
                  ]}
                  aria-label="Priorität filtern"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 font-semibold transition-all duration-200 bg-[linear-gradient(138deg,#6460e6_0%,#4b46c8_58%,#3e3aa2_100%)] border-[#6861e1] text-white hover:translate-y-[-1px]">Anwenden</button>
              <button type="button" onClick={() => { setSearch(''); setStatus(''); setCategory(''); setPriorityFilter(''); }} className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 font-semibold transition-all duration-200 bg-[#171a2b] border-[#2a2f45] text-[#d6dbf0]">Zurücksetzen</button>
            </div>
          </form>
        </div>

        {/* Mittlere Spalte: Liste */}
        <div>
          <div className="rounded-2xl border border-[#2a2f45] bg-[#131625] shadow-[0_0_0_1px_rgba(104,97,225,0.08),0_30px_60px_-20px_rgba(0,0,0,0.45)]">
            <div className="px-5 py-4 border-b border-[#212131] flex items-center justify-between bg-[linear-gradient(180deg,rgba(75,70,200,0.08)_0%,rgba(75,70,200,0)_100%)]">
              <h2 className="text-white font-semibold">Tickets</h2>
              {loadingList && <span className="text-[0.8rem] text-[#8a90ad]">Laden…</span>}
            </div>
            <div className="p-3 space-y-2 max-h-[72vh] overflow-y-auto scrollbar-hide">
              {tickets.map((t) => (
                <button key={t.id} onClick={() => setSelected(t)} className={cn('w-full text-left p-3 rounded-xl border transition-colors', selected?.id === t.id ? 'border-astra-purple/40 bg-astra-purple/10 shadow-[inset_0_0_0_1px_rgba(125,227,255,0.08)]' : 'border-[#2a2f45] bg-[#131625] hover:bg-[#171a2b] hover:border-astra-purple/40 hover:shadow-[0_0_0_1px_rgba(125,227,255,0.06)]')}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[#d6dbf0] font-medium truncate">{t.subject}</p>
                    <p className="text-[#9ca2bd] text-[0.78rem] truncate">{t.user_name} • {t.category}</p>
                  </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn('px-2 py-1 rounded-md text-[0.72rem] border',
                      t.status === 'open' && 'border-[#35406a] bg-[#171e33] text-[#a5c0ff]',
                      t.status === 'in_progress' && 'border-[#5b4cc8]/40 bg-astra-purple/10 text-[#c4b5fd]',
                      t.status === 'resolved' && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
                      t.status === 'closed' && 'border-[#3a3f59] bg-[#161a2d] text-[#8a90ad]'
                    )}>{t.status}</span>
                      <span className={cn('px-2 py-1 rounded-md text-[0.72rem] border',
                        t.priority === 'low' && 'border-[#2f3a55] bg-[#0f162a] text-[#8aa2ff]',
                        t.priority === 'normal' && 'border-[#2a2f45] bg-[#131625] text-[#cdd2ea]',
                        t.priority === 'high' && 'border-amber-500/30 bg-amber-500/10 text-amber-400',
                        t.priority === 'critical' && 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                      )}>{t.priority}</span>
                    </div>
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
        <div>
          <div className="rounded-2xl border border-[#2a2f45] bg-[#131625] flex flex-col h-[calc(100vh-6rem)] shadow-[0_0_0_1px_rgba(104,97,225,0.08),0_30px_60px_-20px_rgba(0,0,0,0.45)]">
            <div className="px-5 py-4 border-b border-[#212131] bg-[linear-gradient(180deg,rgba(75,70,200,0.08)_0%,rgba(75,70,200,0)_100%)] shrink-0">
              <h2 className="text-white font-semibold">Details</h2>
            </div>
            {!selected ? (
              <div className="p-5 text-[#9ca2bd]">Bitte ein Ticket aus der Liste auswählen.</div>
            ) : !detail ? (
              <div className="p-5 text-[#8a90ad]">Laden…</div>
            ) : (
              <div className="flex flex-col flex-1 min-h-0">
                <div className="p-5 space-y-4 shrink-0">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-white font-semibold truncate">{detail.subject}</p>
                    <p className="text-[#9ca2bd] text-[0.85rem] truncate">#{detail.ticket_number} • {detail.user_name} • {detail.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <AstraSelectMenu
                      value={detail.priority}
                      onChange={(v) => handleSetPriority(detail.id, v as TicketPriority)}
                      items={[
                        { value: 'low', label: 'low' },
                        { value: 'normal', label: 'normal' },
                        { value: 'high', label: 'high' },
                        { value: 'critical', label: 'critical' },
                      ]}
                      aria-label="Priorität setzen"
                      className="h-9"
                    />
                    <AstraSelectMenu
                      value={detail.status}
                      onChange={(v) => handleSetStatus(detail.id, v as TicketStatus)}
                      items={[
                        { value: 'open', label: 'open' },
                        { value: 'in_progress', label: 'in_progress' },
                        { value: 'resolved', label: 'resolved' },
                        { value: 'closed', label: 'closed' },
                      ]}
                      aria-label="Status setzen"
                      className="h-9"
                    />
                    <button onClick={() => { setDeleteError(null); setDeleteDialogOpen(true); }} disabled={deleting} className={cn('h-9 px-3 rounded-lg border text-[0.9rem]', deleting ? 'bg-[#171a2b] border-[#2a2f45] text-[#8a90ad]' : 'bg-rose-500/10 border-rose-500/40 text-rose-300 hover:translate-y-[-1px]')}>{deleting ? 'Lösche…' : 'Löschen'}</button>
                  </div>
                </div>

                {/* Nutzerinfo */}
                <div className="rounded-xl border border-[#2a2f45] bg-[#0f1220] p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[#8a90ad] text-[0.85rem]">Nutzerprofil</div>
                    {userInfo ? <div className="text-[0.8rem] text-[#9ca2bd]">ID {userInfo.user_id}</div> : <div className="text-[0.8rem] text-[#8a90ad]">Laden…</div>}
                  </div>
                  {userInfo && (
                    <div className="mt-2 grid grid-cols-2 gap-2 text-[0.9rem]">
                      <div className="col-span-2 flex items-center gap-3">
                        {userInfo.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={userInfo.avatar_url} alt="Avatar" className="w-10 h-10 rounded-full border border-[#2a2f45]" />
                        ) : (
                          <div className="w-10 h-10 rounded-full border border-[#2a2f45] bg-[#131625]" />
                        )}
                        <div className="min-w-0">
                          <div className="text-white font-medium truncate">{userInfo.display_name || userInfo.username || 'Unbekannt'}</div>
                          <div className="text-[#8a90ad] text-[0.8rem] truncate">{userInfo.username || '—'}</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-[#8a90ad] text-[0.8rem]">Tickets gesamt</div>
                        <div className="text-white">{userInfo.total_tickets}</div>
                      </div>
                      <div>
                        <div className="text-[#8a90ad] text-[0.8rem]">Offen</div>
                        <div className="text-white">{userInfo.open_tickets}</div>
                      </div>
                      <div>
                        <div className="text-[#8a90ad] text-[0.8rem]">Gelöst</div>
                        <div className="text-white">{userInfo.resolved_tickets}</div>
                      </div>
                      <div>
                        <div className="text-[#8a90ad] text-[0.8rem]">Geschlossen</div>
                        <div className="text-white">{userInfo.closed_tickets}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-[#8a90ad] text-[0.8rem]">Letzte Aktivität</div>
                        <div className="text-white">{userInfo.last_support_activity ? new Date(userInfo.last_support_activity).toLocaleString('de-DE') : '—'}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Nutzerhistorie */}
                <div className="rounded-xl border border-[#2a2f45] bg-[#0f1220] p-3">
                  <div className="text-[#8a90ad] text-[0.85rem] mb-2">Weitere Tickets des Nutzers</div>
                  <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                    {!userHistory ? (
                      <div className="text-[#8a90ad] text-[0.9rem]">Laden…</div>
                    ) : userHistory.length === 0 ? (
                      <div className="text-[#9ca2bd] text-[0.9rem]">Keine weiteren Tickets.</div>
                    ) : (
                      userHistory.map((h) => (
                        <button key={h.id} onClick={() => setSelected({ ...selected!, id: h.id, ticket_number: h.ticket_number, user_id: selected!.user_id, user_name: selected!.user_name, subject: h.subject, category: h.category, status: h.status, priority: h.priority, created_at: h.created_at, updated_at: h.updated_at })} className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-[#131625]">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-[#d6dbf0] text-[0.9rem] truncate">{h.subject}</div>
                              <div className="text-[#8a90ad] text-[0.75rem] truncate">#{h.ticket_number} • {h.category}</div>
                            </div>
                            <span className={cn('px-2 py-0.5 rounded-md text-[0.72rem] border',
                              h.status === 'open' && 'border-[#35406a] bg-[#171e33] text-[#a5c0ff]',
                              h.status === 'in_progress' && 'border-[#5b4cc8]/40 bg-astra-purple/10 text-[#c4b5fd]',
                              h.status === 'resolved' && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
                              h.status === 'closed' && 'border-[#3a3f59] bg-[#161a2d] text-[#8a90ad]'
                            )}>{h.status}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                </div>
                <MessageList messages={detail.messages} currentUserId={user?.id ?? null} adminView={true} />
                <div className="px-5 pb-5 pt-2 shrink-0">
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
              </div>
            )}
          </div>
        </div>
      </div>
      <AstraConfirmDialog
        open={deleteDialogOpen}
        title="Ticket wirklich löschen?"
        description={detail ? `Ticket #${detail.ticket_number} – ${detail.subject}` : undefined}
        warning="Dieser Vorgang kann nicht rückgängig gemacht werden. Die Konversation wird dauerhaft entfernt."
        confirmLabel="Endgültig löschen"
        cancelLabel="Abbrechen"
        loading={deleting}
        error={deleteError}
        onCancel={() => { if (!deleting) setDeleteDialogOpen(false); }}
        onConfirm={confirmDelete}
      />
    </DashboardLayout>
  );
};

export default AdminTicketsPage;
