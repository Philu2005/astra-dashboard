import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { moderationApi } from '@/services/moderation-api';
import type { WarnItem } from '@/types/moderation';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import SettingsCard from '@/components/settings/SettingsCard';
import { StyledInput } from '@/components/ui/StyledInput';
import { StyledButton } from '@/components/ui/StyledButton';
import { StyledBadge } from '@/components/ui/StyledBadge';

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
    <div className="space-y-5">
      <SettingsPageHeader
        heading="Verwarnungen"
        description="Verwarnungen für ein ausgewähltes Mitglied anzeigen und verwalten."
        actions={<StyledBadge variant="default">{count} Ergebnis(se)</StyledBadge>}
      />

      {error && (
        <SettingsCard>
          <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-[0.95rem] text-red-200">{error}</div>
        </SettingsCard>
      )}

      <SettingsCard header={<span className="text-[#dbe3ff]">Suche</span>}>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="mb-1 text-[0.9rem] text-[#9ca2be]">Discord‑Mitglieds‑ID</div>
            <StyledInput
              placeholder="z. B. 123456789012345678"
              inputMode="numeric"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <StyledButton onClick={load} disabled={!canQuery || loading} variant="primary">
              {loading ? 'Laden…' : 'Laden'}
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
        <p className="mt-2 text-[0.86rem] text-[#9ca2be]">
          Hinweis: Es gibt keinen API‑Endpunkt zum Erstellen oder globalen Durchsuchen von Verwarnungen. Bitte gib eine
          konkrete Mitglieds‑ID ein.
        </p>
      </SettingsCard>

      <SettingsCard header={<span className="text-[#dbe3ff]">Ergebnisse ({count})</span>}>
        {loading && <div className="text-[0.95rem] text-[#c1c7de]">Laden…</div>}
        {!loading && warns.length === 0 && (
          <div className="text-[0.95rem] text-[#9ca2be]">Keine Verwarnungen vorhanden.</div>
        )}
        {!loading && warns.length > 0 && (
          <ul className="divide-y divide-[#2d3246] text-[0.95rem]">
            {warns.map((w) => (
              <li key={w.warnId} className="flex items-center justify-between py-2">
                <div className="min-w-0">
                  <div className="truncate font-medium text-white">{w.warnId}</div>
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
