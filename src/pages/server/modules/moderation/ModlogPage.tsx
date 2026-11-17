import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { moderationApi } from '@/services/moderation-api';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import SettingsCard from '@/components/settings/SettingsCard';
import { StyledInput } from '@/components/ui/StyledInput';
import { StyledButton } from '@/components/ui/StyledButton';
import SettingsSaveBar from '@/components/settings/SettingsSaveBar';

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
    return () => {
      active = false;
    };
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

  return (
    <div className="space-y-5">
      <SettingsPageHeader heading="Modlog" description="Zielkanal für Moderationsprotokolle festlegen." />

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
        <SettingsCard header={<span className="text-[#dbe3ff]">Konfiguration</span>}>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="mb-1 text-[0.9rem] text-[#9ca2be]">Kanal‑ID</div>
              <StyledInput
                placeholder="z. B. 123456789012345678"
                inputMode="numeric"
                value={channelId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setChannelId(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <StyledButton onClick={onSave} disabled={saving || !channelId.trim()} variant="primary">
                {saving ? 'Speichern…' : 'Speichern'}
              </StyledButton>
              <StyledButton onClick={onDelete} disabled={deleting || current === null} variant="ghost">
                {deleting ? 'Entfernen…' : 'Konfiguration entfernen'}
              </StyledButton>
            </div>
          </div>
          <p className="mt-2 text-[0.86rem] text-[#9ca2be]">
            Hinweis: Eine komfortable Kanalauswahl folgt, sobald die Kanalliste serverseitig bereitsteht. Bis dahin kann
            die Kanal‑ID direkt eingetragen werden.
          </p>
        </SettingsCard>
      )}

      <SettingsSaveBar dirty={dirty} saving={saving || deleting} onSave={onSave} onCancel={() => setChannelId(current ?? '')} />
    </div>
  );
};

export default ModlogPage;