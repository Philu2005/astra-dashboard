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
  
  // Verbesserte Namensauflösung
  const currentChannel = channels.find(c => c.id === current);
  const currentChannelName = currentChannel 
    ? currentChannel.name 
    : (loading || channelsLoading ? 'Wird geladen...' : (current ? `Unbekannter Kanal (${current})` : 'Nicht konfiguriert'));

  return (
    <div className="max-w-[1440px] mx-auto space-y-6">
      <SettingsPageHeader
        heading="Ticket-Log"
        description="Konfiguriere einen Kanal, in dem Ticket-Ereignisse automatisch protokolliert werden."
        backTo={`/servers/${guildId}/modules`}
        backLabel="Modulübersicht"
      />

      {loading && (
        <SettingsCard>
          <div className="flex items-center gap-3 text-[0.95rem] text-[#c1c7de]">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-astra-purple border-t-transparent" />
            Lade Konfiguration...
          </div>
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
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px] items-start">
          <div className="space-y-6">
            {/* Status */}
            <SettingsCard>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${isActive ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-[#3a3d5a]'}`} />
                  <span className="text-[1.05rem] font-medium text-[#dbe3ff]">
                    {isActive ? 'Ticket-Log ist aktiv' : 'Ticket-Log ist nicht konfiguriert'}
                  </span>
                </div>
                {isActive && current && (
                  <div className="flex items-center gap-2 rounded-full border border-[#2a2d4a] bg-[#13152a]/80 px-4 py-1.5 text-[0.85rem] text-[#8b8fad]">
                    <Hash className="h-4 w-4 text-astra-accent" />
                    <span>Aktueller Kanal: <span className="text-[#dbe3ff] font-medium">{currentChannelName}</span></span>
                  </div>
                )}
              </div>
            </SettingsCard>

            {/* Konfiguration */}
            <SettingsCard 
              header={
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-astra-accent" />
                  <span className="text-[#dbe3ff] font-medium">Log-Kanal konfigurieren</span>
                </div>
              }
            >
              <div className="max-w-2xl space-y-6">
                <div className="space-y-3">
                  <ModuleChannelSelect
                    label="Log-Kanal auswählen"
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
                  <p className="text-[0.85rem] leading-relaxed text-[#8b8fad]">
                    Wähle den Discord-Kanal aus, in dem alle Ticket-Aktionen (Erstellung, Schließen, Löschen) dokumentiert werden sollen.
                  </p>
                </div>
                
                {isActive && (
                  <div className="pt-2 border-t border-[#2a2d4a]/50">
                    <StyledButton 
                      onClick={onDelete} 
                      disabled={deleting} 
                      variant="danger"
                      className="h-9 text-[0.85rem]"
                    >
                      <Trash2 className="h-4 w-4" />
                      {deleting ? 'Wird entfernt…' : 'Konfiguration zurücksetzen'}
                    </StyledButton>
                  </div>
                )}
              </div>
            </SettingsCard>
          </div>

          {/* Info-Card */}
          <div className="space-y-6">
            <SettingsCard 
              header={
                <div className="flex items-center gap-2 text-[#8b8fad]">
                  <Info className="h-4 w-4" />
                  <span className="text-[0.85rem] font-medium uppercase tracking-wider">Information</span>
                </div>
              }
            >
              <div className="space-y-4 text-[0.9rem] leading-relaxed text-[#8b8fad]">
                <p>
                  Der Ticket-Log ist ein wichtiges Sicherheitsfeature. Er protokolliert:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-1 text-[0.85rem]">
                  <li>Wer ein Ticket geöffnet hat</li>
                  <li>Wann ein Ticket geschlossen wurde</li>
                  <li>Transkripte (falls aktiviert)</li>
                  <li>Administrative Eingriffe</li>
                </ul>
                <div className="rounded-lg bg-[#0f111d] p-3 border border-[#2a2d4a]/40 mt-4">
                  <p className="text-[0.8rem] italic">
                    Hinweis: Stelle sicher, dass der Bot Schreibrechte in dem gewählten Kanal besitzt.
                  </p>
                </div>
              </div>
            </SettingsCard>
          </div>
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
