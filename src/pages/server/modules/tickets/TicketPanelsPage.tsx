import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ticketsApi, type TicketPanel, type TicketPanelStatusResponse } from '@/services/tickets-api';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import SettingsCard from '@/components/settings/SettingsCard';
import { StyledInput } from '@/components/ui/StyledInput';
import { StyledButton } from '@/components/ui/StyledButton';
import { LayoutPanelTop, Send, RefreshCw, Hash, Info, CheckCircle2, AlertTriangle, MessageSquare } from 'lucide-react';
import { serversApi, type GuildChannel } from '@/services/servers-api';
import DiscordSelect from '@/components/ui/DiscordSelect';

const TicketPanelsPage: React.FC = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [panels, setPanels] = useState<TicketPanel[]>([]);
  // Status pro channel_id (aus separatem Status-Endpunkt)
  const [panelStatusByChannel, setPanelStatusByChannel] = useState<Record<string, { status?: string; panel_message_id?: string | null }>>({});

  // Publish form
  const [publishChannelId, setPublishChannelId] = useState('');
  const [publishTitle, setPublishTitle] = useState('');
  const [publishDescription, setPublishDescription] = useState('');
  const [publishing, setPublishing] = useState(false);

  // Update form
  const [updateChannelId, setUpdateChannelId] = useState('');
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateDescription, setUpdateDescription] = useState('');
  const [updating, setUpdating] = useState(false);

  // Channels for display and dropdowns
  const [channels, setChannels] = useState<GuildChannel[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [channelsError, setChannelsError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!guildId) return;
      setChannelsLoading(true);
      setChannelsError(null);
      try {
        const res = await serversApi.getChannels(guildId);
        if (!active) return;
        setChannels(res.channels || []);
      } catch (e: any) {
        if (!active) return;
        setChannelsError(e?.message || 'Konnte Kanäle nicht laden.');
      } finally {
        if (active) setChannelsLoading(false);
      }
    })();
    return () => { active = false; };
  }, [guildId]);

  const loadData = async () => {
    if (!guildId) return;
    setLoading(true);
    setError(null);
    try {
      // Panels laden
      const panelsRes = await ticketsApi.getPanels(guildId);
      setPanels(panelsRes.panels);

      // Separaten Veröffentlichungsstatus laden und normalisieren
      try {
        const statusRes: TicketPanelStatusResponse = await ticketsApi.getPanelsStatus(guildId);

        // Defensive Normalisierung: Die interne API kann entweder
        // - ein globales Objekt mit { status, panel_message_id } liefern, oder
        // - ein Objekt mit { panels: [...] } wo jedes Element { channel_id, status, panel_message_id } enthält,
        // - oder eine beliebige Map. Wir unterstützen alle sinnvollen Varianten.
        const map: Record<string, { status?: string; panel_message_id?: string | null }> = {};

        // Variante A: Array unter statusRes.status.panels ODER top-level panels-Array
        const anyStatus = statusRes?.status as any;
        const maybePanelsArray: any[] | undefined = Array.isArray(anyStatus?.panels)
          ? anyStatus.panels
          : Array.isArray((statusRes as any)?.panels)
            ? (statusRes as any).panels
            : undefined;

        if (maybePanelsArray) {
          for (const item of maybePanelsArray) {
            const chRaw = item?.channel_id ?? item?.channel ?? item?.id;
            const ch = chRaw != null ? String(chRaw) : '';
            if (ch) {
              map[ch] = {
                status: typeof item?.status === 'string' ? item.status : undefined,
                panel_message_id: typeof item?.panel_message_id === 'string' ? item.panel_message_id : (item?.panel_message_id ?? undefined),
              };
            }
          }
        } else {
          // Variante B: panels ist ein Objekt/Map: { "channel_id": { status, panel_message_id } }
          const maybePanelsObject: any = anyStatus?.panels && !Array.isArray(anyStatus.panels) && typeof anyStatus.panels === 'object'
            ? anyStatus.panels
            : (typeof (statusRes as any)?.panels === 'object' && !Array.isArray((statusRes as any)?.panels))
              ? (statusRes as any).panels
              : undefined;

          if (maybePanelsObject) {
            for (const [key, val] of Object.entries(maybePanelsObject)) {
              const ch = String(key);
              const v: any = val ?? {};
              map[ch] = {
                status: typeof v?.status === 'string' ? v.status : undefined,
                panel_message_id: typeof v?.panel_message_id === 'string' ? v.panel_message_id : (v?.panel_message_id ?? undefined),
              };
            }
          } else {
          // Variante B: Einzelstatus ohne Kanalbezug – wir mappen ihn auf bekannte Panels (fallback)
          // Dies deckt den beschriebenen Fall ab: { success: true, status: "not_published", panel_message_id: null }
          const globalStatus: string | undefined = typeof anyStatus === 'string' ? anyStatus : anyStatus?.status;
          const globalMsgId = (anyStatus?.panel_message_id ?? (statusRes as any)?.panel_message_id) as string | null | undefined;
          if (globalStatus) {
            for (const p of panelsRes.panels) {
              const ch = p.channel_id != null ? String(p.channel_id) : '';
              if (ch) {
                map[ch] = { status: globalStatus, panel_message_id: typeof globalMsgId === 'string' ? globalMsgId : (globalMsgId ?? undefined) };
              }
            }
          }
        }
        }

        setPanelStatusByChannel(map);
      } catch (e) {
        // Wenn der Status-Endpunkt fehlschlägt oder nicht verfügbar ist, ignorieren wir das –
        // Panels werden dennoch angezeigt, aber ohne expliziten Status.
        // setPanelStatusByChannel({}); // bewusst nicht zurücksetzen, um bestehenden Status nicht zu verlieren
      }
    } catch (e: any) {
      setError(e?.message || 'Fehler beim Laden der Panels.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guildId]);

  // Veröffentlicht gilt, wenn entweder expliziter Status „published“ o.Ä. vorliegt ODER eine panel_message_id existiert.
  const hasPublishedPanel = useMemo(() => {
    return panels.some(p => {
      const ch = p.channel_id;
      const st = ch ? panelStatusByChannel[ch]?.status : undefined;
      const normalized = typeof st === 'string' ? st.toLowerCase() : undefined;
      return Boolean(p.panel_message_id) || normalized === 'published' || normalized === 'published_updated' || normalized === 'published_exists';
    });
  }, [panels, panelStatusByChannel]);

  const getPanelDisplay = (panel: TicketPanel) => {
    const ch = panel.channel_id;
    const st = ch ? panelStatusByChannel[ch]?.status : undefined;
    const msgIdFromStatus = ch ? panelStatusByChannel[ch]?.panel_message_id : undefined;

    // Priorität: expliziter Status vom Status-Endpunkt
    const normalized = typeof st === 'string' ? st.toLowerCase() : undefined;
    if (normalized) {
      if (normalized === 'not_published') {
        return { text: 'Nicht veröffentlicht', tone: 'warn' as const, messageId: msgIdFromStatus };
      }
      // Alle anderen bekannten Veröffentlichungszustände behandeln wir als veröffentlicht
      return { text: 'Veröffentlicht', tone: 'ok' as const, messageId: msgIdFromStatus };
    }

    // Fallback: Heuristik über panel_message_id (darf expliziten Status NICHT überschreiben)
    if (panel.panel_message_id) {
      return { text: 'Veröffentlicht', tone: 'ok' as const, messageId: panel.panel_message_id };
    }

    return { text: 'Status unbekannt', tone: 'unknown' as const, messageId: undefined };
  };

  const channelNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of channels) map[c.id] = c.name || c.id;
    return map;
  }, [channels]);

  const onPublish = async () => {
    if (!guildId) return;
    const trimmed = publishChannelId.trim();
    if (!trimmed) { setError('Bitte einen Kanal auswählen.'); return; }
    setPublishing(true);
    setError(null);
    setInfo(null);
    try {
      const res = await ticketsApi.publishPanel(
        guildId,
        trimmed,
        publishTitle.trim() || undefined,
        publishDescription.trim() || undefined,
      );
      setInfo(res.message || 'Veröffentlichung ausgelöst.');
      setPublishChannelId('');
      setPublishTitle('');
      setPublishDescription('');
      await loadData();
    } catch (e: any) {
      setError(e?.message || 'Veröffentlichung fehlgeschlagen.');
    } finally {
      setPublishing(false);
    }
  };

  const onUpdate = async () => {
    if (!guildId) return;
    const trimmed = updateChannelId.trim();
    if (!trimmed) { setError('Bitte ein bereits veröffentlichtes Panel auswählen.'); return; }
    setUpdating(true);
    setError(null);
    setInfo(null);
    try {
      const res = await ticketsApi.updatePanel(
        guildId,
        trimmed,
        updateTitle.trim() || undefined,
        updateDescription.trim() || undefined,
      );
      setInfo(res.message || 'Panel aktualisiert.');
      await loadData();
    } catch (e: any) {
      setError(e?.message || 'Aktualisierung fehlgeschlagen.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-5">
      <SettingsPageHeader
        heading="Ticket-Panels"
        description="Verwalte und veröffentliche Ticket-Panels in Discord-Kanälen. Über Panels können Nutzer neue Tickets erstellen."
        backTo={`/servers/${guildId}/modules`}
        backLabel="Modulübersicht"
      />

      {error && (
        <SettingsCard>
          <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-[0.95rem] text-red-200">{error}</div>
        </SettingsCard>
      )}
      {info && (
        <SettingsCard>
          <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-[0.95rem] text-emerald-200">{info}</div>
        </SettingsCard>
      )}

      {loading ? (
        <SettingsCard>
          <div className="text-[0.95rem] text-[#c1c7de]">Wird geladen…</div>
        </SettingsCard>
      ) : (
        <>
          {/* Vorhandene Panels */}
          <SettingsCard header={
            <div className="flex items-center gap-2">
              <LayoutPanelTop className="h-5 w-5 text-astra-accent" />
              <span className="text-[#dbe3ff] font-medium">Vorhandene Panels</span>
            </div>
          }>
            {panels.length === 0 ? (
              <div className="flex items-start gap-3 rounded-lg border border-[#2a2d4a] bg-[#13152a]/60 p-4">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#8b8fad]" />
                <p className="text-[0.9rem] leading-relaxed text-[#8b8fad]">
                  Keine Ticket-Panels vorhanden. Veröffentliche ein neues Panel, um loszulegen.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {panels.map((panel, i) => (
                  <div
                    key={panel.channel_id || i}
                    className="flex flex-col gap-2 rounded-lg border border-[#2a2d4a] bg-[#13152a]/60 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      {panel.title && (
                        <p className="text-[0.95rem] font-medium text-white">{panel.title}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 text-[0.85rem] text-[#8b8fad]">
                        {panel.channel_id && (
                          <div className="flex items-center gap-2">
                            <Hash className="h-4 w-4" />
                            <div className="leading-tight">
                              <div className="text-white">{channelNameById[panel.channel_id] || panel.channel_id}</div>
                              <div className="text-[0.78rem] text-[#8b8fad]">ID: {panel.channel_id}</div>
                            </div>
                          </div>
                        )}
                        {(() => {
                          const disp = getPanelDisplay(panel);
                          const mid = disp.messageId ?? panel.panel_message_id;
                          if (!mid) return null;
                          return (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3.5 w-3.5" />
                            {mid}
                          </span>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const disp = getPanelDisplay(panel);
                        if (disp.tone === 'ok') {
                          return (
                            <span className="flex items-center gap-1 text-[0.8rem] text-emerald-400">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {disp.text}
                            </span>
                          );
                        }
                        if (disp.tone === 'warn') {
                          return (
                            <span className="flex items-center gap-1 text-[0.8rem] text-amber-400">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              {disp.text}
                            </span>
                          );
                        }
                        return (
                          <span className="flex items-center gap-1 text-[0.8rem] text-amber-400">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Status unbekannt
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SettingsCard>

          {/* Neues Panel veröffentlichen */}
          <SettingsCard header={
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5 text-astra-accent" />
              <span className="text-[#dbe3ff] font-medium">Neues Panel veröffentlichen</span>
            </div>
          }>
            <div className="space-y-4">
              {hasPublishedPanel && (
                <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                  <p className="text-[0.85rem] leading-relaxed text-amber-200">
                    Es existiert bereits ein veröffentlichtes Panel. Verwende die Aktualisierungsfunktion unten, um Doppelveröffentlichungen zu vermeiden.
                  </p>
                </div>
              )}
              <div className="space-y-1.5">
                <DiscordSelect
                  label="Zielkanal *"
                  kind="channel"
                  items={channels.map(c => ({ id: c.id, name: c.name }))}
                  loading={channelsLoading}
                  error={channelsError}
                  value={publishChannelId}
                  onChange={(id) => setPublishChannelId(id)}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-[0.85rem] font-medium text-[#c1c7de]">Titel (optional)</label>
                  <StyledInput
                    placeholder="Panel-Titel"
                    value={publishTitle}
                    onChange={e => setPublishTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[0.85rem] font-medium text-[#c1c7de]">Beschreibung (optional)</label>
                  <StyledInput
                    placeholder="Panel-Beschreibung"
                    value={publishDescription}
                    onChange={e => setPublishDescription(e.target.value)}
                  />
                </div>
              </div>
              <StyledButton onClick={onPublish} disabled={publishing || !publishChannelId.trim()}>
                <Send className="h-4 w-4" />
                {publishing ? 'Wird veröffentlicht…' : 'Panel veröffentlichen'}
              </StyledButton>
            </div>
          </SettingsCard>

          {/* Bestehendes Panel aktualisieren */}
          <SettingsCard header={
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-astra-accent" />
              <span className="text-[#dbe3ff] font-medium">Veröffentlichtes Panel aktualisieren</span>
            </div>
          }>
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg border border-[#2a2d4a] bg-[#13152a]/60 p-3">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#8b8fad]" />
                <p className="text-[0.85rem] leading-relaxed text-[#8b8fad]">
                  Aktualisiert eine bereits veröffentlichte Panel-Nachricht, anstatt eine neue zu erstellen. Setzt voraus, dass ein Panel im angegebenen Kanal veröffentlicht wurde.
                </p>
              </div>
              <div className="space-y-1.5">
                <DiscordSelect
                  label="Veröffentlichtes Panel auswählen *"
                  kind="channel"
                  items={panels.filter(p => !!p.channel_id).map(p => ({ id: p.channel_id as string, name: channelNameById[p.channel_id as string] || (p.channel_id as string) }))}
                  loading={channelsLoading}
                  error={channelsError}
                  value={updateChannelId}
                  onChange={(id) => setUpdateChannelId(id)}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-[0.85rem] font-medium text-[#c1c7de]">Neuer Titel (optional)</label>
                  <StyledInput
                    placeholder="Neuer Panel-Titel"
                    value={updateTitle}
                    onChange={e => setUpdateTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[0.85rem] font-medium text-[#c1c7de]">Neue Beschreibung (optional)</label>
                  <StyledInput
                    placeholder="Neue Panel-Beschreibung"
                    value={updateDescription}
                    onChange={e => setUpdateDescription(e.target.value)}
                  />
                </div>
              </div>
              <StyledButton onClick={onUpdate} disabled={updating || !updateChannelId.trim()}>
                <RefreshCw className="h-4 w-4" />
                {updating ? 'Wird aktualisiert…' : 'Panel aktualisieren'}
              </StyledButton>
            </div>
          </SettingsCard>
        </>
      )}
    </div>
  );
};

export default TicketPanelsPage;
