import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { moderationApi } from '@/services/moderation-api';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import SettingsCard from '@/components/settings/SettingsCard';
import { StyledInput } from '@/components/ui/StyledInput';
import { StyledButton } from '@/components/ui/StyledButton';
import SettingsSaveBar from '@/components/settings/SettingsSaveBar';
import { BookOpen, Hash, Info } from 'lucide-react';

const ModlogPage: React.FC = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [channelId, setChannelId] = useState<string>('');
  const [current, setCurrent] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!guildId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await moderationApi.getModlog(guildId);
        if (!active) return;
        setCurrent(res.channelId);
        setChannelId(res.channelId ?? '');
      } catch (e: any) {
        if (!active) return;
        setError(e?.message || 'Fehler beim Laden der Modlog‑Konfiguration.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [guildId]);

  const onSave = async () => {
    if (!guildId) return;
    setSaving(true);
    setError(null);
    setInfo(null);
    try {
      const trimmed = channelId.trim();
      if (!trimmed) throw new Error('Bitte eine gültige Kanal‑ID eingeben.');
      const res = await moderationApi.putModlog(guildId, trimmed);
      setCurrent(res.channelId);
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
      const res = await moderationApi.deleteModlog(guildId);
      setCurrent(res.channelId);
      setChannelId('');
      setInfo('Modlog‑Konfiguration entfernt.');
    } catch (e: any) {
      setError(e?.message || 'Löschen fehlgeschlagen.');
    } finally {
      setDeleting(false);
    }
  };

  const dirty = current !== null && channelId.trim() !== (current ?? '');
  const isActive = Boolean(current);

  return (
    <div className="space-y-5">
      <SettingsPageHeader
        heading="Modlog"
        description="Das Modlog protokolliert automatisch Moderationsereignisse in einem festgelegten Discord-Kanal. So behältst du den Überblick über alle Moderationsaktionen auf deinem Server."
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
      {info && (
        <SettingsCard>
          <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-[0.95rem] text-emerald-200">{info}</div>
        </SettingsCard>
      )}

      {!loading && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,60%)_1fr]">
          {/* Linke Spalte: Status + Konfiguration */}
          <div className="space-y-4">
            {/* Status-Card */}
            <SettingsCard>
              <div className="flex items-start gap-4">
                <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border ${isActive ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-[#1d2238] border-[#353c56] text-[#9b95ff]'} transition-colors`}>
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[1rem] font-semibold text-white">Modlog-Status</h3>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[0.75rem] font-semibold ${isActive ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-[#1d2238] text-[#9ca2be] border border-[#353c56]'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-[#6b7194]'}`} />
                      {isActive ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </div>
                  {isActive ? (
                    <div className="flex items-center gap-2 text-[0.88rem] text-muted-foreground">
                      <Hash className="w-4 h-4 text-[#7de3ff]" />
                      <span>Zielkanal: <span className="text-white font-medium">{current}</span></span>
                    </div>
                  ) : (
                    <p className="text-[0.88rem] text-muted-foreground">
                      Kein Zielkanal konfiguriert. Richte einen Kanal ein, um Moderationsereignisse automatisch zu protokollieren.
                    </p>
                  )}
                </div>
              </div>
            </SettingsCard>

            {/* Konfiguration */}
            <SettingsCard header={
              <div>
                <span className="text-[#dbe3ff] font-medium">Kanal-Konfiguration</span>
                <p className="text-[0.85rem] text-muted-foreground mt-0.5">Lege den Discord-Kanal fest, in dem Moderationsereignisse protokolliert werden sollen. Alle automatischen und manuellen Moderationsaktionen werden dort als Nachrichten gesendet.</p>
              </div>
            }>
              <div className="space-y-3">
                <div>
                  <div className="mb-1.5 text-[0.88rem] text-[#9ca2be] font-medium">Zielkanal (Kanal‑ID)</div>
                  <StyledInput
                    placeholder="z. B. 123456789012345678"
                    inputMode="numeric"
                    value={channelId}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setChannelId(e.target.value)}
                  />
                  <p className="mt-1.5 text-[0.82rem] text-[#7f89aa]">
                    Gib die ID des Textkanals ein, in dem Astra die Moderationsprotokolle senden soll. Die Kanal-ID findest du in Discord unter Kanaleinstellungen oder per Rechtsklick bei aktiviertem Entwicklermodus.
                  </p>
                </div>
                <div className="flex gap-2 pt-1">
                  <StyledButton onClick={onSave} disabled={saving || !channelId.trim()} variant="primary">
                    {saving ? 'Speichern…' : 'Speichern'}
                  </StyledButton>
                  <StyledButton onClick={onDelete} disabled={deleting || current === null} variant="ghost">
                    {deleting ? 'Entfernen…' : 'Konfiguration entfernen'}
                  </StyledButton>
                </div>
              </div>
            </SettingsCard>
          </div>

          {/* Rechte Spalte: Informationsbereich */}
          <div className="space-y-4">
            <SettingsCard header={
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-[#7de3ff]" />
                <span className="text-[#dbe3ff] font-medium">Informationen</span>
              </div>
            }>
              <div className="space-y-4">
                <div>
                  <h4 className="text-[0.9rem] font-medium text-white mb-1">Was wird protokolliert?</h4>
                  <p className="text-[0.85rem] text-muted-foreground">
                    Das Modlog zeichnet Moderationsereignisse auf, die durch Astra oder Moderatoren ausgelöst werden. Dazu gehören insbesondere:
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="rounded-md border border-border bg-background/40 p-2.5">
                    <div className="text-[0.85rem] font-medium text-foreground">Verwarnungen</div>
                    <div className="text-[0.82rem] text-muted-foreground">Wenn ein Benutzer eine Verwarnung erhält oder eine Verwarnung entfernt wird.</div>
                  </div>
                  <div className="rounded-md border border-border bg-background/40 p-2.5">
                    <div className="text-[0.85rem] font-medium text-foreground">AutoMod-Aktionen</div>
                    <div className="text-[0.82rem] text-muted-foreground">Automatische Timeouts, Kicks oder Bans, die durch konfigurierte Moderationsregeln ausgelöst werden.</div>
                  </div>
                  <div className="rounded-md border border-border bg-background/40 p-2.5">
                    <div className="text-[0.85rem] font-medium text-foreground">Beleidigungsfilter</div>
                    <div className="text-[0.82rem] text-muted-foreground">Erkannte Beleidigungen und die daraus resultierenden Moderationsmaßnahmen.</div>
                  </div>
                </div>
                <div className="rounded-md border border-[#2d3246] bg-[#141728]/60 p-3">
                  <p className="text-[0.82rem] text-[#9ca2be]">
                    <span className="font-medium text-[#dbe3ff]">Hinweis:</span> Das Modlog dient ausschließlich der Protokollierung. Die eigentlichen Moderationsaktionen werden durch die AutoMod-Regeln und den Beleidigungsfilter gesteuert.
                  </p>
                </div>
              </div>
            </SettingsCard>
          </div>
        </div>
      )}

      <SettingsSaveBar dirty={dirty} saving={saving || deleting} onSave={onSave} onCancel={() => setChannelId(current ?? '')} />
    </div>
  );
};

export default ModlogPage;
