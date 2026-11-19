import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ticketsApi } from '@/services/tickets-api';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import SettingsCard from '@/components/settings/SettingsCard';
import { StyledInput } from '@/components/ui/StyledInput';
import { StyledButton } from '@/components/ui/StyledButton';
import SettingsSaveBar from '@/components/settings/SettingsSaveBar';
import { BookOpen, Hash, Info, Trash2 } from 'lucide-react';
import { serversApi, type GuildChannel } from '@/services/servers-api';
import { ModuleChannelSelect } from '@/components/module-ui';

const TicketLogPage: React.FC = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [channelId, setChannelId] = useState('');
  const [current, setCurrent] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [channels, setChannels] = useState<GuildChannel[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [channelsError, setChannelsError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!guildId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await ticketsApi.getLog(guildId);
        if (!active) return;
        setCurrent(res.channel_id ?? null);
        setChannelId(res.channel_id ?? '');
      } catch (e: any) {
        if (!active) return;
        setError(e?.message || 'Fehler beim Laden der Ticket-Log-Konfiguration.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [guildId]);

  // Kanäle laden für Dropdown
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

  const onSave = async () => {
    if (!guildId) return;
    setSaving(true);
    setError(null);
    setInfo(null);
    try {
      const trimmed = channelId.trim();
      if (!trimmed) throw new Error('Bitte eine gültige Kanal-ID eingeben.');
      const res = await ticketsApi.putLog(guildId, trimmed);
      setCurrent(res.channel_id ?? null);
      setInfo('Gespeichert.');
    } catch (e: any) {
      setError(e?.message || 'Speichern fehlgeschlagen.');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!guildId) return;
    setDeleting(true);
    setError(null);
    setInfo(null);
    try {
      await ticketsApi.deleteLog(guildId);
      setCurrent(null);
      setChannelId('');
      setInfo('Ticket-Log-Konfiguration entfernt.');
    } catch (e: any) {
      setError(e?.message || 'Löschen fehlgeschlagen.');
    } finally {
      setDeleting(false);
    }
  };

  const dirty = (current !== null && channelId.trim() !== (current ?? '')) || (!current && channelId.trim().length > 0);
  const isActive = Boolean(current);
  const currentChannelName = channels.find(c => c.id === current)?.name || current;

  return (
    <div className="space-y-5">
      <SettingsPageHeader
        heading="Ticket-Log"
        description="Konfiguriere einen Kanal, in dem Ticket-Ereignisse automatisch protokolliert werden."
        backTo={`/servers/${guildId}/modules`}
        backLabel="Modulübersicht"
      />

      {loading && (
        <SettingsCard>
          <div className="text-[0.95rem] text-[#c1c7de]">Wird geladen…</div>
        </SettingsCard>
      )}
      {error && (
        <SettingsCard>
          <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-[0.95rem] text-red-200">{error}</div>
        </SettingsCard>
      )}
      {info && !dirty && (
        <SettingsCard>
          <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-[0.95rem] text-emerald-200">{info}</div>
        </SettingsCard>
      )}

      {!loading && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,60%)_1fr]">
          <div className="space-y-4">
            {/* Status */}
            <SettingsCard>
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${isActive ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-[#3a3d5a]'}`} />
                <span className="text-[0.95rem] text-[#c1c7de]">
                  {isActive ? 'Ticket-Log ist aktiv' : 'Ticket-Log ist nicht konfiguriert'}
                </span>
              </div>
              {isActive && current && (
                <div className="mt-3 flex items-center gap-2 rounded-md border border-[#2a2d4a] bg-[#13152a]/60 px-3 py-2 text-[0.85rem] text-[#8b8fad]">
                  <Hash className="h-4 w-4" />
                  <span>Aktueller Kanal: <span className="text-white">{currentChannelName}</span></span>
                </div>
              )}
            </SettingsCard>

            {/* Konfiguration */}
            <SettingsCard header={
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-astra-accent" />
                <span className="text-[#dbe3ff] font-medium">Log-Kanal konfigurieren</span>
              </div>
            }>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <ModuleChannelSelect
                    label="Log-Kanal"
                    items={channels.map(c => ({ 
                      id: c.id, 
                      name: c.name,
                      type: c.type,
                      parent_id: c.parent_id ?? null,
                      parent_name: (channels.find(pc => pc.id === c.parent_id)?.name) ?? null
                    }))}
                    loading={channelsLoading}
                    error={channelsError}
                    value={channelId}
                    onChange={(id) => setChannelId(id)}
                  />
                  <p className="text-[0.8rem] text-[#8b8fad]">Wähle den Kanal aus, in dem Ticket‑Ereignisse protokolliert werden.</p>
                </div>
                {isActive && (
                  <StyledButton onClick={onDelete} disabled={deleting} variant="danger">
                    <Trash2 className="h-4 w-4" />
                    {deleting ? 'Wird entfernt…' : 'Log-Konfiguration entfernen'}
                  </StyledButton>
                )}
              </div>
            </SettingsCard>
          </div>

          {/* Info-Card */}
          <SettingsCard>
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#8b8fad]" />
              <div className="space-y-2 text-[0.85rem] leading-relaxed text-[#8b8fad]">
                <p>
                  Der Ticket-Log protokolliert automatisch Ereignisse wie das Öffnen, Schließen und Löschen von Tickets.
                </p>
                <p>
                  Aktiviere den Entwicklermodus in Discord, um Kanal-IDs per Rechtsklick kopieren zu können.
                </p>
              </div>
            </div>
          </SettingsCard>
        </div>
      )}

      <SettingsSaveBar
        dirty={dirty}
        saving={saving}
        onSave={onSave}
        onCancel={() => setChannelId(current ?? '')}
      />
    </div>
  );
};

export default TicketLogPage;
