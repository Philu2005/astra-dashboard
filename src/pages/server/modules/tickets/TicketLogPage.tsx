import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ticketsApi } from '@/services/tickets-api';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import SettingsCard from '@/components/settings/SettingsCard';
import { StyledInput } from '@/components/ui/StyledInput';
import { StyledButton } from '@/components/ui/StyledButton';
import SettingsSaveBar from '@/components/settings/SettingsSaveBar';
import { BookOpen, Hash, Info, Trash2 } from 'lucide-react';
import { serversApi, type GuildChannel, type GuildCategory } from '@/services/servers-api';
import { ModuleChannelSelect } from '@/components/module-ui';
import { useChannelResources } from '@/hooks/useChannelResources';

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
  const [categories, setCategories] = useState<GuildCategory[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [channelsError, setChannelsError] = useState<string | null>(null);
  const { textChannelResources } = useChannelResources(channels, categories);

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

  // Ressourcen (Kanäle & Kategorien) laden für Dropdown
  useEffect(() => {
    let active = true;
    (async () => {
      if (!guildId) return;
      setChannelsLoading(true);
      setChannelsError(null);
      try {
        const [chRes, caRes] = await Promise.allSettled([
          serversApi.getChannels(guildId),
          serversApi.getCategories(guildId),
        ]);
        if (!active) return;
        
        if (chRes.status === 'fulfilled') setChannels(chRes.value.channels || []);
        if (caRes.status === 'fulfilled') setCategories(caRes.value.categories || []);
      } catch (e: any) {
        if (!active) return;
        setChannelsError(e?.message || 'Konnte Ressourcen nicht laden.');
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
    <div className="space-y-5 lg:space-y-6">
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
          <div className="lg:col-span-8 space-y-5 lg:space-y-6">
            {/* Status & Konfiguration in einer Card für Kompaktheit oder eng zusammen */}
            <SettingsCard 
              header={
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-astra-accent" />
                    <span className="text-[#dbe3ff] font-medium">Konfiguration</span>
                  </div>
                  <div className="flex items-center gap-2 text-[0.85rem]">
                    <div className={`h-2.5 w-2.5 rounded-full ${isActive ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-[#3a3d5a]'}`} />
                    <span className={isActive ? 'text-emerald-400' : 'text-[#8b8fad]'}>
                      {isActive ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </div>
                </div>
              }
            >
              <div className="space-y-6">
                {isActive && current && (
                  <div className="flex items-center gap-2 rounded-lg border border-[#2a2d4a] bg-[#13152a]/60 px-4 py-3 text-[0.9rem]">
                    <Hash className="h-4 w-4 text-astra-accent" />
                    <span className="text-[#8b8fad]">Aktuell konfiguriert: <span className="text-[#dbe3ff] font-medium">{currentChannelName}</span></span>
                  </div>
                )}

                <div className="space-y-3">
                  <ModuleChannelSelect
                    label="Log-Kanal auswählen"
                    items={textChannelResources}
                    loading={channelsLoading}
                    error={channelsError}
                    value={channelId}
                    onChange={(id) => setChannelId(id)}
                  />
                  <p className="text-[0.85rem] leading-relaxed text-[#8b8fad]">
                    Wähle den Discord-Kanal aus, in dem alle Ticket-Aktionen dokumentiert werden sollen.
                  </p>
                </div>
                
                {isActive && (
                  <div className="pt-2 border-t border-[#2a2d4a]/50 flex justify-end">
                    <StyledButton 
                      onClick={onDelete} 
                      disabled={deleting} 
                      variant="danger"
                      className="h-9 w-full sm:w-auto text-[0.85rem] flex-row"
                    >
                      <Trash2 className="h-4 w-4 shrink-0" />
                      <span className="truncate">{deleting ? 'Wird entfernt…' : 'Konfiguration zurücksetzen'}</span>
                    </StyledButton>
                  </div>
                )}
              </div>
            </SettingsCard>
          </div>

          {/* Info-Card */}
          <div className="lg:col-span-4">
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
                  Der Ticket-Log protokolliert automatisch wichtige Ereignisse für maximale Transparenz:
                </p>
                <ul className="grid grid-cols-1 gap-2 ml-1 text-[0.85rem]">
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-astra-purple mt-1.5 shrink-0" />
                    <span>Ticket-Erstellung & Schließung</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-astra-purple mt-1.5 shrink-0" />
                    <span>Transkripte & Nachrichten-Logs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-astra-purple mt-1.5 shrink-0" />
                    <span>Administrative Eingriffe</span>
                  </li>
                </ul>
                <div className="rounded-lg bg-[#0f111d] p-3 border border-[#2a2d4a]/40 mt-4">
                  <p className="text-[0.8rem] italic leading-snug">
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
