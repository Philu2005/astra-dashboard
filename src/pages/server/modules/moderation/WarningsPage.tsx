import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { moderationApi } from '@/services/moderation-api';
import type { WarnItem } from '@/types/moderation';

const WarningsPage: React.FC = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const [memberId, setMemberId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warns, setWarns] = useState<WarnItem[]>([]);
  const [count, setCount] = useState<number>(0);
  const [confirmAll, setConfirmAll] = useState(false);

  const canQuery = useMemo(() => Boolean(guildId && memberId.trim()), [guildId, memberId]);

  const load = async () => {
    if (!canQuery || !guildId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await moderationApi.getWarns(guildId, memberId.trim());
      setWarns(res.warns || []);
      setCount(res.count || 0);
    } catch (e: any) {
      setError(e?.message || 'Fehler beim Laden der Verwarnungen.');
      setWarns([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setWarns([]);
    setCount(0);
    setError(null);
    setConfirmAll(false);
  }, [memberId]);

  const onDeleteOne = async (warnId: string) => {
    if (!guildId || !canQuery) return;
    setLoading(true);
    setError(null);
    try {
      await moderationApi.deleteWarn(guildId, memberId.trim(), warnId);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Löschen fehlgeschlagen.');
      setLoading(false);
    }
  };

  const onDeleteAll = async () => {
    if (!guildId || !canQuery) return;
    if (!confirmAll) {
      setConfirmAll(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await moderationApi.deleteAllWarns(guildId, memberId.trim());
      await load();
      setConfirmAll(false);
    } catch (e: any) {
      setError(e?.message || 'Löschen fehlgeschlagen.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-white">Verwarnungen</h2>
        <p className="text-sm text-foreground/70">Verwarnungen für ein ausgewähltes Mitglied anzeigen und verwalten.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
      )}

      <section className="rounded-lg border border-layout-divider bg-black/20 p-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
          <label className="block text-sm">
            <span className="mb-1 block text-foreground/70">Discord‑Mitglieds‑ID</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="z. B. 123456789012345678"
              className="w-full rounded-md border border-layout-divider bg-[#0b0e1a] px-3 py-2 text-white outline-none focus:border-[#4b46c8]"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
            />
          </label>
          <div className="flex gap-2">
            <button
              onClick={load}
              disabled={!canQuery || loading}
              className="inline-flex items-center rounded-md bg-[#4b46c8] px-4 py-2 text-sm font-medium text-white hover:bg-[#3e39b0] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Laden…' : 'Laden'}
            </button>
            <button
              onClick={onDeleteAll}
              disabled={!canQuery || loading || warns.length === 0}
              className="inline-flex items-center rounded-md border border-layout-divider bg-transparent px-4 py-2 text-sm font-medium text-foreground hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
              title={confirmAll ? 'Zum Bestätigen erneut klicken' : undefined}
            >
              {confirmAll ? 'Wirklich alle löschen?' : 'Alle Verwarnungen löschen'}
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-foreground/60">
          Hinweis: Es gibt keinen API‑Endpunkt zum Erstellen oder globalen Durchsuchen von Verwarnungen. Bitte gib eine
          konkrete Mitglieds‑ID ein.
        </p>
      </section>

      <section className="rounded-lg border border-layout-divider bg-black/20 p-4">
        <h3 className="mb-3 text-sm font-semibold text-white">Ergebnisse ({count})</h3>
        {loading && <div className="text-sm text-foreground/70">Laden…</div>}
        {!loading && warns.length === 0 && (
          <div className="text-sm text-foreground/60">Keine Verwarnungen vorhanden.</div>
        )}
        {!loading && warns.length > 0 && (
          <ul className="divide-y divide-layout-divider text-sm">
            {warns.map((w) => (
              <li key={w.warnId} className="flex items-center justify-between py-2">
                <div className="min-w-0">
                  <div className="truncate font-medium text-white">{w.warnId}</div>
                  <div className="truncate text-foreground/70">{w.reason || '—'}</div>
                </div>
                <button
                  onClick={() => onDeleteOne(w.warnId)}
                  disabled={loading}
                  className="ml-4 inline-flex shrink-0 items-center rounded-md border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-200 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Entfernen
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default WarningsPage;
