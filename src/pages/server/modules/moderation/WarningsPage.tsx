import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { moderationApi } from '@/services/moderation-api';
import type { WarnItem } from '@/types/moderation';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import SettingsCard from '@/components/settings/SettingsCard';
import { StyledButton } from '@/components/ui/StyledButton';
import { StyledBadge } from '@/components/ui/StyledBadge';

const WarningsPage: React.FC = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warns, setWarns] = useState<WarnItem[]>([]);
  const [count, setCount] = useState<number>(0);
  const [confirmAll, setConfirmAll] = useState(false);

  const canQuery = useMemo(() => Boolean(guildId), [guildId]);

  const load = async () => {
    if (!canQuery || !guildId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await moderationApi.getGuildWarns(guildId);
      const items = (res.warns || []).map((w) => ({ ...w }));
      setWarns(items);
      setCount(res.count || items.length || 0);
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
    // Beim Öffnen/Wechsel der Guild laden
    if (guildId) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guildId]);

  const onDeleteOne = async (warnId: string) => {
    if (!guildId || !canQuery) return;
    setLoading(true);
    setError(null);
    try {
      // Einzel-Löschung setzt einen member-spezifischen Endpoint voraus.
      // Wir ermitteln die userId aus dem Datensatz.
      const warn = warns.find((w) => w.warnId === warnId);
      if (!warn) throw new Error('Verwarnung nicht gefunden.');
      await moderationApi.deleteWarn(guildId, warn.userId, warnId);
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
      await moderationApi.deleteAllWarnsGuild(guildId);
      await load();
      setConfirmAll(false);
    } catch (e: any) {
      setError(e?.message || 'Löschen fehlgeschlagen.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <SettingsPageHeader
        heading="Verwarnungen"
        description="Alle Verwarnungen dieser Guild anzeigen und verwalten."
        actions={<StyledBadge variant="default">{count} Ergebnis(se)</StyledBadge>}
      />

      {error && (
        <SettingsCard>
          <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-[0.95rem] text-red-200">{error}</div>
        </SettingsCard>
      )}

      <SettingsCard header={<span className="text-[#dbe3ff]">Aktionen</span>}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-[0.9rem] text-[#9ca2be]">
            Hinweis: Daten stammen direkt aus Astras API. Sortierung: Nutzer aufsteigend, Verwarnungen absteigend.
          </div>
          <div className="flex gap-2">
            <StyledButton onClick={load} disabled={!canQuery || loading} variant="primary">
              {loading ? 'Aktualisiere…' : 'Aktualisieren'}
            </StyledButton>
            <StyledButton
              onClick={onDeleteAll}
              disabled={!canQuery || loading || warns.length === 0}
              title={confirmAll ? 'Zum Bestätigen erneut klicken' : undefined}
              variant="ghost"
            >
              {confirmAll ? 'Wirklich alle löschen?' : 'Alle Verwarnungen löschen'}
            </StyledButton>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard header={<span className="text-[#dbe3ff]">Ergebnisse ({count})</span>}>
        {loading && <div className="text-[0.95rem] text-[#c1c7de]">Laden…</div>}
        {!loading && warns.length === 0 && (
          <div className="text-[0.95rem] text-[#9ca2be]">Keine Verwarnungen vorhanden.</div>
        )}
        {!loading && warns.length > 0 && (
          <ul className="divide-y divide-[#2d3246] text-[0.95rem]">
            {warns.map((w) => (
              <li key={`${w.userId}-${w.warnId}`} className="flex items-center justify-between gap-4 py-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full border border-border bg-secondary px-2.5 py-0.5 text-[0.82rem] text-foreground">
                      {w.userId}
                    </span>
                    <span className="truncate font-medium text-white">{w.warnId}</span>
                  </div>
                  <div className="truncate text-[#9ca2be]">{w.reason || '—'}</div>
                </div>
                <StyledButton onClick={() => onDeleteOne(w.warnId)} disabled={loading} size="sm" variant="danger">
                  Entfernen
                </StyledButton>
              </li>
            ))}
          </ul>
        )}
      </SettingsCard>
    </div>
  );
};

export default WarningsPage;
