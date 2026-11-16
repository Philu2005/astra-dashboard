import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { moderationApi } from '@/services/moderation-api';

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-white">Modlog</h2>
        <p className="text-sm text-foreground/70">Zielkanal für Moderationsprotokolle festlegen.</p>
      </div>

      {loading && (
        <div className="rounded-lg border border-layout-divider bg-black/20 p-4 text-sm text-foreground/70">Wird geladen…</div>
      )}
      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
      )}
      {info && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">{info}</div>
      )}

      {!loading && (
        <section className="rounded-lg border border-layout-divider bg-black/20 p-4">
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
              <label className="block">
                <span className="mb-1 block text-foreground/70">Kanal‑ID</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="z. B. 123456789012345678"
                  className="w-full rounded-md border border-layout-divider bg-[#0b0e1a] px-3 py-2 text-white outline-none focus:border-[#4b46c8]"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                />
              </label>
              <div className="flex gap-2">
                <button
                  onClick={onSave}
                  disabled={saving || !channelId.trim()}
                  className="inline-flex items-center rounded-md bg-[#4b46c8] px-4 py-2 text-sm font-medium text-white hover:bg-[#3e39b0] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Speichern…' : 'Speichern'}
                </button>
                <button
                  onClick={onDelete}
                  disabled={deleting || current === null}
                  className="inline-flex items-center rounded-md border border-layout-divider bg-transparent px-4 py-2 text-sm font-medium text-foreground hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleting ? 'Entfernen…' : 'Konfiguration entfernen'}
                </button>
              </div>
            </div>
            <p className="text-foreground/60">
              Hinweis: Eine komfortable Kanalauswahl folgt, sobald die Kanalliste serverseitig bereitsteht. Bis dahin
              kann die Kanal‑ID direkt eingetragen werden.
            </p>
          </div>
        </section>
      )}
    </div>
  );
};

export default ModlogPage;
