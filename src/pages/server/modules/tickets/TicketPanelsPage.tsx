import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ticketsApi, type TicketPanel } from '@/services/tickets-api';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import SettingsCard from '@/components/settings/SettingsCard';
import { StyledInput } from '@/components/ui/StyledInput';
import { StyledButton } from '@/components/ui/StyledButton';
import { LayoutPanelTop, Send, RefreshCw, Hash, Info, CheckCircle2, AlertTriangle, MessageSquare } from 'lucide-react';

const TicketPanelsPage: React.FC = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [panels, setPanels] = useState<TicketPanel[]>([]);

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

  const loadData = async () => {
    if (!guildId) return;
    setLoading(true);
    setError(null);
    try {
      const panelsRes = await ticketsApi.getPanels(guildId);
      setPanels(panelsRes.panels);
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

  const hasPublishedPanel = panels.some(p => p.panel_message_id);

  const onPublish = async () => {
    if (!guildId) return;
    const trimmed = publishChannelId.trim();
    if (!trimmed) { setError('Bitte eine Kanal-ID eingeben.'); return; }
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
    if (!trimmed) { setError('Bitte die Kanal-ID des veröffentlichten Panels eingeben.'); return; }
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
                          <span className="flex items-center gap-1">
                            <Hash className="h-3.5 w-3.5" />
                            {panel.channel_id}
                          </span>
                        )}
                        {panel.panel_message_id && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3.5 w-3.5" />
                            {panel.panel_message_id}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {panel.panel_message_id ? (
                        <span className="flex items-center gap-1 text-[0.8rem] text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Veröffentlicht
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[0.8rem] text-amber-400">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Status unbekannt
                        </span>
                      )}
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
                <label className="block text-[0.85rem] font-medium text-[#c1c7de]">Zielkanal-ID *</label>
                <StyledInput
                  placeholder="z.B. 1234567890123456789"
                  value={publishChannelId}
                  onChange={e => setPublishChannelId(e.target.value)}
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
                <label className="block text-[0.85rem] font-medium text-[#c1c7de]">Kanal-ID des veröffentlichten Panels *</label>
                <StyledInput
                  placeholder="z.B. 1234567890123456789"
                  value={updateChannelId}
                  onChange={e => setUpdateChannelId(e.target.value)}
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
