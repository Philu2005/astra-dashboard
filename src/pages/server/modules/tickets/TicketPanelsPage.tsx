import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ticketsApi, type TicketPanel, type TicketPanelConfigRequest } from '@/services/tickets-api';
import { serversApi, type GuildChannel, type GuildRole, type GuildCategory } from '@/services/servers-api';
import { cn } from '@/lib/utils';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import SettingsCard from '@/components/settings/SettingsCard';
import { StyledInput } from '@/components/ui/StyledInput';
import { StyledTextarea } from '@/components/ui/StyledTextarea';
import { StyledButton } from '@/components/ui/StyledButton';
import DiscordSelect from '@/components/ui/DiscordSelect';
import AstraConfirmDialog from '@/components/ui/AstraConfirmDialog';
import EmbedPreview from '@/components/tickets/EmbedPreview';
import FloatingActionBar from '@/components/ui/FloatingActionBar';
import {
  LayoutPanelTop, Plus, Pencil, Trash2, Send, Hash, Shield, FolderTree,
  CheckCircle2, AlertTriangle, XCircle, Loader2, ArrowRightLeft, X,
  ChevronDown,
} from 'lucide-react';

/* ── Typen ──────────────────────────────────────────────────────── */

interface PanelStatus {
  status?: string;
  panel_message_id?: string | null;
}

interface EditorState {
  title: string;
  description: string;
  topic: string;
  support_role_id: string;
  category_id: string;
  channel_id: string;
}

const EMPTY_EDITOR: EditorState = {
  title: '', description: '', topic: '',
  support_role_id: '', category_id: '', channel_id: '',
};

function editorFromPanel(p: TicketPanel): EditorState {
  return {
    title: p.title || '',
    description: p.description || '',
    topic: (p.topic as string) || '',
    support_role_id: (p.support_role_id as string) || '',
    category_id: (p.category_id as string) || '',
    channel_id: p.channel_id || '',
  };
}

/* ── Hilfs-Komponenten ──────────────────────────────────────────── */

function StatusBadge({ tone, text }: { tone: 'ok' | 'warn' | 'error' | 'unknown'; text: string }) {
  const cls = {
    ok: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    warn: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    error: 'text-red-400 border-red-500/30 bg-red-500/10',
    unknown: 'text-[#8b8fad] border-[#2a2d4a] bg-[#13152a]/60',
  }[tone];
  const Icon = { ok: CheckCircle2, warn: AlertTriangle, error: XCircle, unknown: AlertTriangle }[tone];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[0.78rem] font-medium ${cls}`}>
      <Icon className="h-3 w-3" /> {text}
    </span>
  );
}

function FieldGroup({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      <h4 className="text-[0.85rem] font-semibold text-astra-cyan/80 uppercase tracking-wider">{label}</h4>
      {children}
    </div>
  );
}

/* ── Hauptkomponente ────────────────────────────────────────────── */

const TicketPanelsPage: React.FC = () => {
  const { guildId } = useParams<{ guildId: string }>();

  // Data
  const [panels, setPanels] = useState<TicketPanel[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, PanelStatus>>({});
  const [channels, setChannels] = useState<GuildChannel[]>([]);
  const [roles, setRoles] = useState<GuildRole[]>([]);
  const [categories, setCategories] = useState<GuildCategory[]>([]);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [resLoading, setResLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'ok' | 'error'; msg: string } | null>(null);

  // Dialogs
  const [showCreate, setShowCreate] = useState(false);
  const [editPanel, setEditPanel] = useState<TicketPanel | null>(null);
  const [deletePanel, setDeletePanel] = useState<TicketPanel | null>(null);
  const [movePanel, setMovePanel] = useState<TicketPanel | null>(null);
  const [expandedPanel, setExpandedPanel] = useState<string | null>(null);

  // Create form
  const [createForm, setCreateForm] = useState<EditorState>({ ...EMPTY_EDITOR });
  const [creating, setCreating] = useState(false);

  // Edit form
  const [editForm, setEditForm] = useState<EditorState>({ ...EMPTY_EDITOR });
  const [saving, setSaving] = useState(false);
  const initialEditRef = useRef<EditorState | null>(null);

  // Delete
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Move
  const [moveChannelId, setMoveChannelId] = useState('');
  const [moving, setMoving] = useState(false);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  /* ── Daten laden ──────────────────────────────────────────────── */

  const loadResources = useCallback(async () => {
    if (!guildId) return;
    setResLoading(true);
    try {
      const [chRes, roRes, caRes] = await Promise.allSettled([
        serversApi.getChannels(guildId),
        serversApi.getRoles(guildId),
        serversApi.getCategories(guildId),
      ]);
      if (chRes.status === 'fulfilled') setChannels(chRes.value.channels || []);
      if (roRes.status === 'fulfilled') setRoles(roRes.value.roles || []);
      if (caRes.status === 'fulfilled') setCategories(caRes.value.categories || []);
    } finally {
      setResLoading(false);
    }
  }, [guildId]);

  const loadPanels = useCallback(async () => {
    if (!guildId) return;
    setLoading(true);
    setError(null);
    try {
      const [panelsRes, statusRes] = await Promise.allSettled([
        ticketsApi.getPanels(guildId),
        ticketsApi.getPanelsStatus(guildId),
      ]);
      if (panelsRes.status === 'fulfilled') {
        setPanels(panelsRes.value.panels || []);
      } else {
        setError((panelsRes.reason as Error)?.message || 'Panels konnten nicht geladen werden.');
      }
      if (statusRes.status === 'fulfilled') {
        const raw = statusRes.value?.status as Record<string, unknown> | undefined;
        const map: Record<string, PanelStatus> = {};
        if (raw && typeof raw === 'object') {
          const arr = Array.isArray((raw as any).panels) ? (raw as any).panels : undefined;
          if (arr) {
            for (const item of arr) {
              const ch = String(item?.channel_id || '');
              if (ch) map[ch] = { status: item?.status, panel_message_id: item?.panel_message_id };
            }
          } else if (typeof (raw as any).panels === 'object' && (raw as any).panels) {
            for (const [k, v] of Object.entries((raw as any).panels)) {
              map[k] = v as PanelStatus;
            }
          }
        }
        setStatusMap(map);
      }
    } finally {
      setLoading(false);
    }
  }, [guildId]);

  useEffect(() => { loadResources(); }, [loadResources]);
  useEffect(() => { loadPanels(); }, [loadPanels]);

  /* ── Lookup-Maps ──────────────────────────────────────────────── */

  const channelName = useMemo(() => {
    const m: Record<string, string> = {};
    channels.forEach(c => { m[c.id] = c.name || c.id; });
    return m;
  }, [channels]);

  const roleName = useMemo(() => {
    const m: Record<string, string> = {};
    roles.forEach(r => { m[r.id] = r.name || r.id; });
    return m;
  }, [roles]);

  const categoryName = useMemo(() => {
    const m: Record<string, string> = {};
    categories.forEach(c => { m[c.id] = c.name || c.id; });
    return m;
  }, [categories]);

  const textChannels = useMemo(() => channels.filter(c => !c.type || c.type === 0), [channels]);

  /* ── Panel-Status ─────────────────────────────────────────────── */

  function getPanelStatus(p: TicketPanel): { tone: 'ok' | 'warn' | 'error' | 'unknown'; text: string; messageId?: string } {
    const ch = p.channel_id || '';
    const st = statusMap[ch];
    const norm = st?.status?.toLowerCase();
    const msgId = st?.panel_message_id || (p.panel_message_id as string) || undefined;
    if (norm === 'published' || norm === 'published_updated' || norm === 'published_exists') {
      return { tone: 'ok', text: 'Aktiv', messageId: msgId };
    }
    if (norm === 'not_published') return { tone: 'warn', text: 'Nicht veröffentlicht', messageId: msgId };
    if (norm === 'error') return { tone: 'error', text: 'Fehler', messageId: msgId };
    if (p.panel_message_id) return { tone: 'ok', text: 'Aktiv', messageId: String(p.panel_message_id) };
    return { tone: 'unknown', text: 'Status unbekannt', messageId: msgId };
  }

  /* ── Aktionen ─────────────────────────────────────────────────── */

  const onPublish = async () => {
    if (!guildId || !createForm.channel_id) return;
    setCreating(true);
    try {
      const res = await ticketsApi.publishPanel(guildId, {
        channel_id: createForm.channel_id,
        title: createForm.title || undefined,
        description: createForm.description || undefined,
      });
      setToast({ type: 'ok', msg: res.message || 'Panel veröffentlicht.' });
      setShowCreate(false);
      setCreateForm({ ...EMPTY_EDITOR });
      await loadPanels();
    } catch (e: any) {
      setToast({ type: 'error', msg: e?.message || 'Veröffentlichung fehlgeschlagen.' });
    } finally {
      setCreating(false);
    }
  };

  const onSaveEdit = async () => {
    if (!guildId || !editPanel?.channel_id) return;
    setSaving(true);
    try {
      const payload: TicketPanelConfigRequest = {};
      const fields: (keyof EditorState)[] = [
        'title', 'description', 'topic', 'support_role_id', 'category_id',
      ];
      for (const f of fields) {
        const val = editForm[f];
        if (val) (payload as any)[f] = val;
      }
      await ticketsApi.updatePanelConfig(guildId, editPanel.channel_id, payload);
      // Also update the embed message if title/description changed
      if (editForm.title || editForm.description) {
        try {
          await ticketsApi.updatePanel(guildId, editPanel.channel_id, {
            title: editForm.title || undefined,
            description: editForm.description || undefined,
          });
        } catch { /* config update succeeded, message update is best-effort */ }
      }
      setToast({ type: 'ok', msg: 'Panel aktualisiert.' });
      setExpandedPanel(null);
      setEditPanel(null);
      initialEditRef.current = null;
      await loadPanels();
    } catch (e: any) {
      setToast({ type: 'error', msg: e?.message || 'Speichern fehlgeschlagen.' });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!guildId || !deletePanel?.channel_id) return;
    const msgId = getPanelStatus(deletePanel).messageId || (deletePanel.panel_message_id as string);
    if (!msgId) { setDeleteError('Keine Message-ID vorhanden. Panel kann nicht gelöscht werden.'); return; }
    setDeleting(true);
    setDeleteError(null);
    try {
      await ticketsApi.deletePanel(guildId, deletePanel.channel_id, msgId);
      setToast({ type: 'ok', msg: 'Panel gelöscht.' });
      setDeletePanel(null);
      await loadPanels();
    } catch (e: any) {
      setDeleteError(e?.message || 'Löschen fehlgeschlagen.');
    } finally {
      setDeleting(false);
    }
  };

  const onMove = async () => {
    if (!guildId || !movePanel?.channel_id || !moveChannelId) return;
    setMoving(true);
    try {
      const res = await ticketsApi.updatePanelConfig(guildId, movePanel.channel_id, { channel_id: moveChannelId });
      setToast({ type: 'ok', msg: res.message || 'Panel verschoben.' });
      setMovePanel(null);
      setMoveChannelId('');
      await loadPanels();
    } catch (e: any) {
      setToast({ type: 'error', msg: e?.message || 'Verschieben fehlgeschlagen.' });
    } finally {
      setMoving(false);
    }
  };

  /* ── Render ───────────────────────────────────────────────────── */

  const isDirty = useMemo(() => {
    if (!initialEditRef.current) return false;
    try {
      return JSON.stringify(initialEditRef.current) !== JSON.stringify(editForm);
    } catch {
      return true;
    }
  }, [editForm]);

  return (
    <div className="space-y-5">
      <SettingsPageHeader
        heading="Ticket-Panels"
        description="Verwalte und veröffentliche Ticket-Panels in Discord-Kanälen."
        backTo={`/servers/${guildId}/modules`}
        backLabel="Modulübersicht"
        actions={
          <StyledButton
            variant="primary"
            size="md"
            leftIcon={<Plus />}
            onClick={() => { setCreateForm({ ...EMPTY_EDITOR }); setShowCreate(true); }}
          >
            Neues Panel
          </StyledButton>
        }
      />

      {/* Toast */}
      {toast && (
        <div className={`rounded-lg border p-3 text-[0.9rem] ${toast.type === 'ok' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200' : 'border-red-500/40 bg-red-500/10 text-red-200'}`}>
          {toast.msg}
        </div>
      )}

      {/* Statistik-Leiste */}
      {!loading && !error && (
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          {[
            { label: 'Panels', value: panels.length, icon: LayoutPanelTop },
            { label: 'Aktiv', value: panels.filter(p => getPanelStatus(p).tone === 'ok').length, icon: CheckCircle2 },
            { label: 'Kanäle', value: new Set(panels.map(p => p.channel_id).filter(Boolean)).size, icon: Hash },
            { label: 'Rollen', value: new Set(panels.map(p => p.support_role_id).filter(Boolean)).size, icon: Shield },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-[#2d3246] bg-[linear-gradient(180deg,#141728_0%,#121524_100%)] p-2.5 sm:p-3 text-center">
              <s.icon className="mx-auto mb-1 h-4 w-4 sm:h-5 sm:w-5 text-astra-accent" />
              <p className="text-base sm:text-lg font-semibold text-white">{s.value}</p>
              <p className="text-[0.72rem] sm:text-[0.78rem] text-[#8b8fad] uppercase tracking-tight sm:tracking-normal">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Ladezustand */}
      {loading && (
        <SettingsCard>
          <div className="flex items-center gap-2 text-[0.95rem] text-[#c1c7de]">
            <Loader2 className="h-4 w-4 animate-spin" /> Panels werden geladen…
          </div>
        </SettingsCard>
      )}

      {/* Fehler */}
      {error && (
        <SettingsCard>
          <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-[0.95rem] text-red-200">{error}</div>
        </SettingsCard>
      )}

      {/* Panel-Liste */}
      {!loading && !error && panels.length === 0 && (
        <SettingsCard>
          <div className="py-8 text-center">
            <LayoutPanelTop className="mx-auto mb-3 h-10 w-10 text-[#3a3f5c]" />
            <p className="text-[0.95rem] text-[#8b8fad]">Noch keine Ticket-Panels vorhanden.</p>
            <p className="mt-1 text-[0.85rem] text-[#6b7094]">Erstelle ein neues Panel, um loszulegen.</p>
          </div>
        </SettingsCard>
      )}

      {!loading && !error && panels.length > 0 && (
        <div className="space-y-3">
          {panels.map((panel, i) => {
            const st = getPanelStatus(panel);
            const isExpanded = expandedPanel === panel.channel_id;
            
            return (
              <div 
                key={panel.channel_id || i}
                className={cn(
                  'rounded-2xl border transition-all duration-300 ease-out group',
                  isExpanded 
                    ? 'border-astra-purple/40 bg-[#15182b] shadow-astra-glow ring-1 ring-astra-purple/10' 
                    : 'border-[#2d3246] bg-[linear-gradient(180deg,#141728_0%,#121524_100%)] hover:border-[#3a4163]'
                )}
              >
                {/* Header: Clickable for toggle */}
                <button
                  type="button"
                  className="w-full text-left p-4 focus:outline-none"
                  onClick={() => {
                    if (isExpanded) {
                      setExpandedPanel(null);
                      setEditPanel(null);
                    } else {
                      const snap = editorFromPanel(panel);
                      initialEditRef.current = snap;
                      setEditForm(snap);
                      setEditPanel(panel);
                      setExpandedPanel(panel.channel_id || null);
                    }
                  }}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[0.95rem] font-medium text-white truncate">
                          {panel.title || 'Ticket-Panel'}
                        </p>
                        <StatusBadge tone={st.tone} text={st.text} />
                      </div>
                      {panel.description && !isExpanded && (
                        <p className="text-[0.83rem] text-[#8b8fad] line-clamp-1">{panel.description as string}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.8rem] text-[#8b8fad]">
                        {panel.channel_id && (
                          <span className="flex items-center gap-1">
                            <Hash className="h-3.5 w-3.5" />
                            {channelName[panel.channel_id] || panel.channel_id}
                          </span>
                        )}
                        {panel.support_role_id && (
                          <span className="flex items-center gap-1">
                            <Shield className="h-3.5 w-3.5" />
                            {roleName[panel.support_role_id as string] || panel.support_role_id}
                          </span>
                        )}
                        {panel.category_id && (
                          <span className="flex items-center gap-1">
                            <FolderTree className="h-3.5 w-3.5" />
                            {categoryName[panel.category_id as string] || panel.category_id}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => { setMovePanel(panel); setMoveChannelId(''); }}
                        className="rounded-lg border border-[#2a2d4a] bg-[#13152a]/60 p-2 text-[#8b8fad] hover:text-astra-cyan hover:border-astra-cyan/30 transition-colors"
                        title="Verschieben"
                      >
                        <ArrowRightLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => { setDeletePanel(panel); setDeleteError(null); }}
                        className="rounded-lg border border-[#2a2d4a] bg-[#13152a]/60 p-2 text-[#8b8fad] hover:text-red-400 hover:border-red-500/30 transition-colors"
                        title="Löschen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <div className={cn(
                        'flex items-center justify-center w-8 h-8 rounded-full border border-[#2a2d4a] bg-[#13152a]/60 text-[#5c6180] transition-all duration-300', 
                        isExpanded ? 'rotate-180 border-astra-purple/40 bg-astra-purple/10 text-astra-purple' : 'group-hover:border-[#3a4163]'
                      )}>
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </button>

                {/* Edit Area (Accordion) */}
                <div 
                  className={cn(
                    "grid transition-[grid-template-rows] duration-300 ease-out",
                    isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  )}
                >
                  <div className="overflow-hidden">
                    <div 
                      className="px-5 pb-6 pt-2 border-t border-[#2a2f45]/50"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
                        <div className="space-y-6 pt-4">
                          <FieldGroup label="Einstellungen">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                              <DiscordSelect 
                                label="Support-Rolle" 
                                kind="role" 
                                items={roles.map(r => ({ id: r.id, name: r.name, color: r.color }))} 
                                loading={resLoading} 
                                value={editForm.support_role_id || null} 
                                onChange={v => setEditForm(f => ({ ...f, support_role_id: v }))} 
                                className="w-full" 
                              />
                              <DiscordSelect
                                label="Ziel-Kanal"
                                kind="channel"
                                groupByCategory
                                items={textChannels.map(c => ({ 
                                  id: c.id, 
                                  name: c.name, 
                                  type: c.type, 
                                  parent_id: c.parent_id ?? null, 
                                  parent_name: categoryName[c.parent_id || ''] || null 
                                }))}
                                loading={resLoading}
                                value={editForm.channel_id || null}
                                onChange={v => setEditForm(f => ({ ...f, channel_id: v }))}
                                className="w-full"
                              />
                            </div>
                          </FieldGroup>
                          <FieldGroup label="Inhalt">
                            <div className="space-y-4">
                              <div>
                                <label className="mb-1.5 block text-[0.85rem] font-medium text-[#c1c7de]">Thema (intern)</label>
                                <StyledInput placeholder="z. B. Allgemeiner Support" value={editForm.topic} onChange={e => setEditForm(f => ({ ...f, topic: e.target.value }))} className="w-full" />
                              </div>
                              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                  <label className="mb-1.5 block text-[0.85rem] font-medium text-[#c1c7de]">Titel</label>
                                  <StyledInput placeholder="Panel-Titel" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} className="w-full" />
                                </div>
                                <div>
                                  <label className="mb-1.5 block text-[0.85rem] font-medium text-[#c1c7de]">Beschreibung</label>
                                  <StyledTextarea placeholder="Panel-Beschreibung" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} className="w-full min-h-[80px]" />
                                </div>
                              </div>
                            </div>
                          </FieldGroup>
                          
                          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2a2f45]">
                            <StyledButton variant="ghost" onClick={() => setExpandedPanel(null)} disabled={saving}>Abbrechen</StyledButton>
                            <StyledButton onClick={onSaveEdit} loading={saving} disabled={!isDirty}>
                              Speichern
                            </StyledButton>
                          </div>
                        </div>

                        <div className="hidden lg:block pt-4">
                          <div className="sticky top-6">
                            <h4 className="text-[0.85rem] font-semibold text-astra-cyan/80 uppercase tracking-wider mb-3">Vorschau</h4>
                            <EmbedPreview title={editForm.title} description={editForm.description} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create Dialog ─────────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[2vh] sm:pt-[5vh] pb-10 overflow-y-auto">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !creating && setShowCreate(false)} />
          <div className="relative z-10 w-[95%] max-w-3xl rounded-2xl border border-[#2a2f45] bg-[#131625] shadow-2xl flex flex-col my-auto">
            <div className="flex items-center justify-between border-b border-[#2a2f45] px-4 sm:px-5 py-3 sm:py-4">
              <h3 className="text-lg font-semibold text-white">Neues Panel</h3>
              <button type="button" onClick={() => setShowCreate(false)} className="text-[#8b8fad] hover:text-white p-1"><X className="h-6 w-6" /></button>
            </div>
            <div className="grid max-h-[70vh] sm:max-h-[78vh] grid-cols-1 gap-6 overflow-y-auto p-4 sm:p-5 lg:grid-cols-[1fr_280px]">
              <div className="space-y-6">
                <FieldGroup label="Discord‑Zuweisungen">
                  <div className="space-y-4">
                    <DiscordSelect
                      label="Zielkanal *"
                      kind="channel"
                      groupByCategory
                      items={textChannels.map(c => ({ id: c.id, name: c.name, type: c.type, parent_id: c.parent_id ?? null, parent_name: categoryName[c.parent_id || ''] || null }))}
                      loading={resLoading}
                      value={createForm.channel_id}
                      onChange={v => {
                        // Automatically set category if channel is in a category
                        const channel = channels.find(c => c.id === v);
                        setCreateForm(f => ({ 
                          ...f, 
                          channel_id: v,
                          category_id: channel?.parent_id || f.category_id
                        }));
                      }}
                      className="w-full"
                    />
                    <DiscordSelect label="Support-Rolle" kind="role" items={roles.map(r => ({ id: r.id, name: r.name, color: r.color }))} loading={resLoading} value={createForm.support_role_id || null} onChange={v => setCreateForm(f => ({ ...f, support_role_id: v }))} className="w-full" />
                  </div>
                </FieldGroup>
                <FieldGroup label="Inhalt">
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-[0.85rem] font-medium text-[#c1c7de]">Thema</label>
                      <StyledInput placeholder="z. B. Allgemeiner Support" value={createForm.topic} onChange={e => setCreateForm(f => ({ ...f, topic: e.target.value }))} className="w-full h-11" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[0.85rem] font-medium text-[#c1c7de]">Titel</label>
                      <StyledInput placeholder="Panel-Titel" value={createForm.title} onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))} className="w-full h-11" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[0.85rem] font-medium text-[#c1c7de]">Beschreibung</label>
                      <StyledTextarea placeholder="Panel-Beschreibung" value={createForm.description} onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))} className="w-full min-h-[100px]" />
                    </div>
                  </div>
                </FieldGroup>
                
                {/* Mobile Preview (only visible on small screens) */}
                <div className="lg:hidden pt-4 border-t border-[#2a2f45]">
                  <h4 className="text-[0.85rem] font-semibold text-astra-cyan/80 uppercase tracking-wider mb-3">Vorschau</h4>
                  <EmbedPreview title={createForm.title} description={createForm.description} />
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="sticky top-0">
                  <EmbedPreview title={createForm.title} description={createForm.description} />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-[#2a2f45] px-4 sm:px-5 py-3 sm:py-4">
              <StyledButton variant="ghost" onClick={() => setShowCreate(false)} disabled={creating} className="h-11 sm:h-10 px-4">Abbrechen</StyledButton>
              <StyledButton onClick={onPublish} disabled={creating || !createForm.channel_id} leftIcon={!creating && <Send className="w-4 h-4" />} className="h-11 sm:h-10 px-6">
                {creating ? 'Veröffentliche…' : 'Veröffentlichen'}
              </StyledButton>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Dialog ───────────────────────────────────────────── */}
      {/* Removed separate Edit Modal in favor of Accordion-Style inline edit */}

      {/* ── Move Dialog ───────────────────────────────────────────── */}
      {movePanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => !moving && setMovePanel(null)} />
          <div className="relative z-10 w-[92%] max-w-md rounded-2xl border border-[#2a2f45] bg-[#131625] shadow-xl p-5 space-y-4">
            <h3 className="text-lg font-semibold text-white">Panel verschieben</h3>
            <p className="text-[0.85rem] text-[#8b8fad]">
              Verschiebe das Panel aus <span className="text-white font-medium">#{channelName[movePanel.channel_id || ''] || movePanel.channel_id}</span> in einen anderen Kanal.
            </p>
            <DiscordSelect
              label="Neuer Zielkanal"
              kind="channel"
              groupByCategory
              items={textChannels
                .filter(c => c.id !== movePanel.channel_id)
                .map(c => ({ id: c.id, name: c.name, type: c.type, parent_id: c.parent_id ?? null, parent_name: categoryName[c.parent_id || ''] || null }))}
              loading={resLoading}
              value={moveChannelId || null}
              onChange={v => setMoveChannelId(v)}
            />
            <div className="flex items-center justify-end gap-3 pt-2">
              <StyledButton variant="ghost" onClick={() => setMovePanel(null)} disabled={moving}>Abbrechen</StyledButton>
              <StyledButton onClick={onMove} disabled={moving || !moveChannelId} leftIcon={<ArrowRightLeft />}>
                {moving ? 'Wird verschoben…' : 'Verschieben'}
              </StyledButton>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Dialog ─────────────────────────────────────────── */}
      <AstraConfirmDialog
        open={!!deletePanel}
        title="Panel löschen"
        description={`Das Panel „${deletePanel?.title || 'Ticket-Panel'}" in #${channelName[deletePanel?.channel_id || ''] || deletePanel?.channel_id || '?'} wird unwiderruflich gelöscht.`}
        warning="Die Discord-Nachricht und die Panel-Konfiguration werden entfernt. Aktive Tickets bleiben bestehen."
        confirmLabel="Endgültig löschen"
        loading={deleting}
        error={deleteError}
        onConfirm={onDelete}
        onCancel={() => { setDeletePanel(null); setDeleteError(null); }}
      />
    </div>
  );
};

export default TicketPanelsPage;
