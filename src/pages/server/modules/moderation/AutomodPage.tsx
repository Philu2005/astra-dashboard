import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { moderationApi } from '@/services/moderation-api';
import type { AutomodConfig, AutomodRule } from '@/types/moderation';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import SettingsCard from '@/components/settings/SettingsCard';
import SettingsSection from '@/components/settings/SettingsSection';
import SettingsSaveBar from '@/components/settings/SettingsSaveBar';
import { StyledSwitch } from '@/components/ui/StyledSwitch';
import { StyledNumberInput } from '@/components/ui/StyledNumberInput';
import { StyledSelect } from '@/components/ui/StyledSelect';
import { StyledButton } from '@/components/ui/StyledButton';
import { StyledBadge } from '@/components/ui/StyledBadge';
import { StatCard } from '@/components/StatCard';
import { CaseSensitive, ListChecks, ShieldAlert, Plus, Trash2 } from 'lucide-react';

type SaveState = 'idle' | 'saving' | 'success' | 'error';

const AutomodPage: React.FC = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  const [rules, setRules] = useState<AutomodRule[]>([]);

  const [capsEnabled, setCapsEnabled] = useState<boolean>(false);
  const [capsPercent, setCapsPercent] = useState<number | ''>('');

  const [profanityEnabled, setProfanityEnabled] = useState<boolean>(false);

  const ACTION_OPTIONS = useMemo(
    () => [
      { value: 'timeout', label: 'Timeout' },
      { value: 'kick', label: 'Kick' },
      { value: 'ban', label: 'Ban' },
    ],
    [],
  );

  const buildConfig = useCallback((): Record<string, any> => {
    // Payload-Struktur entspricht der internen Astra-API:
    // { rules, capslock: {enabled, percent}, blacklist: {enabled} }
    const capsPercentNum = capsPercent === '' ? undefined : Number(capsPercent);
    return {
      rules: rules
        .filter((r) => Number.isFinite(r.warns) && r.action)
        .sort((a, b) => a.warns - b.warns)
        .map((r) => ({
          warns: Number(r.warns),
          action: r.action,
          ...(r.action === 'timeout' && r.timeout_seconds ? { timeout_seconds: Number(r.timeout_seconds) } : {}),
        })),
      capslock: {
        enabled: capsEnabled,
        percent: capsPercentNum,
      },
      blacklist: {
        enabled: Boolean(profanityEnabled),
      },
    };
  }, [rules, capsEnabled, capsPercent, profanityEnabled]);

  const normalizeAction = (a: any): string => {
    const v = String(a ?? '').toLowerCase();
    return ['timeout', 'kick', 'ban'].includes(v) ? v : '';
  };

  const parseRules = (cfg: any): AutomodRule[] => {
    const rawRules: any = cfg?.rules;
    let nextRules: AutomodRule[] = [];
    if (Array.isArray(rawRules)) {
      nextRules = rawRules
        .map((r: any) => ({
          warns: Number(r?.warns ?? 0),
          action: normalizeAction(r?.action),
          ...(r?.timeout_seconds != null ? { timeout_seconds: Number(r.timeout_seconds) } : {}),
        }))
        .filter((r: AutomodRule) => r.warns > 0 && r.action);
    } else if (rawRules && typeof rawRules === 'object') {
      nextRules = [{
        warns: Number(rawRules.warns ?? 0),
        action: normalizeAction(rawRules.action),
        ...(rawRules.timeout_seconds != null ? { timeout_seconds: Number(rawRules.timeout_seconds) } : {}),
      }].filter((r) => r.warns > 0 && r.action);
    }
    return nextRules.sort((a, b) => a.warns - b.warns);
  };

  const toBool = (v: any): boolean => {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v !== 0;
    if (typeof v === 'string') return v === 'true' || v === '1';
    return Boolean(v);
  };

  const applyConfig = (cfg: any) => {
    setRules(parseRules(cfg));
    // capslock: { enabled, percent } aus der internen API
    const capsEn = cfg?.capslock?.enabled ?? false;
    setCapsEnabled(toBool(capsEn));
    setCapsPercent(cfg?.capslock?.percent ?? '');
    // blacklist: { enabled } aus der internen API
    const profEn = cfg?.blacklist?.enabled ?? false;
    setProfanityEnabled(toBool(profEn));
  };

  useEffect(() => {
    let active = true;
    async function load() {
      if (!guildId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await moderationApi.getAutomod(guildId);
        if (!active) return;
        applyConfig(res.config || {});
      } catch (e: any) {
        if (!active) return;
        setError(e?.message || 'Fehler beim Laden der AutoMod‑Konfiguration.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [guildId]);

  const onSave = async () => {
    if (!guildId) return;
    setSaveState('saving');
    setError(null);
    try {
      const payload = buildConfig();
      await moderationApi.putAutomod(guildId, payload);
      setSaveState('success');
      setTimeout(() => setSaveState('idle'), 1600);
      try {
        const fresh = await moderationApi.getAutomod(guildId);
        const cfg = fresh.config || {};
        applyConfig(cfg);
        const snap = JSON.stringify({
          rules: parseRules(cfg),
          capsEnabled: toBool(cfg?.capslock?.enabled ?? false),
          capsPercent: cfg?.capslock?.percent ?? '',
          profanityEnabled: toBool(cfg?.blacklist?.enabled ?? false),
        });
        setInitialSnapshot(snap);
      } catch {
        // Nutzer sieht success
      }
    } catch (e: any) {
      setSaveState('error');
      setError(e?.message || 'Speichern fehlgeschlagen.');
    }
  };

  const [initialSnapshot, setInitialSnapshot] = useState<string>('');
  useEffect(() => {
    if (!loading) {
      const snap = JSON.stringify({ rules, capsEnabled, capsPercent, profanityEnabled });
      if (!initialSnapshot) setInitialSnapshot(snap);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const isDirty = useMemo(() => {
    const current = JSON.stringify({ rules, capsEnabled, capsPercent, profanityEnabled });
    return current !== initialSnapshot;
  }, [rules, capsEnabled, capsPercent, profanityEnabled, initialSnapshot]);

  const addRule = () => {
    const next: AutomodRule = { warns: Math.max(1, (rules.at(-1)?.warns || 0) + 1), action: 'timeout', timeout_seconds: 60 };
    setRules((prev) => [...prev, next]);
  };
  const updateRule = (index: number, patch: Partial<AutomodRule>) => {
    setRules((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };
  const removeRule = (index: number) => {
    setRules((prev) => prev.filter((_, i) => i !== index));
  };
  const sortedRules = useMemo(() => [...rules].sort((a, b) => a.warns - b.warns), [rules]);

  return (
    <div className="space-y-5">
      <SettingsPageHeader
        heading="AutoMod"
        description="Konfiguriere die automatischen Moderationsfunktionen für deinen Server. Regeln legen fest, welche Aktion bei einer bestimmten Anzahl von Verwarnungen ausgeführt wird."
        backTo={`/servers/${guildId}/modules`}
        backLabel="Modulübersicht"
        actions={
          <StyledBadge variant={isDirty ? 'purple' : 'default'}>{isDirty ? 'Änderungen nicht gespeichert' : 'Aktuell'}</StyledBadge>
        }
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

      {!loading && (
        <>
          {/* Statistikkarten */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard title="Regeln" value={String(rules.length)} icon={ListChecks} />
            <StatCard title="Capslock" value={capsEnabled ? 'Aktiv' : 'Inaktiv'} icon={CaseSensitive} />
            <StatCard title="Beleidigungsfilter" value={profanityEnabled ? 'Aktiv' : 'Inaktiv'} icon={ShieldAlert} />
          </div>

          {/* Hauptlayout */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,58%)_1fr]">
            {/* Linke Spalte: Regeln */}
            <div className="space-y-4">
              <SettingsCard
                header={
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[#dbe3ff] font-medium">Moderationsregeln</span>
                      <p className="text-[0.85rem] text-muted-foreground mt-0.5">Lege fest, welche Aktion bei einer bestimmten Anzahl von Verwarnungen automatisch ausgeführt wird.</p>
                    </div>
                    <StyledButton variant="secondary" size="sm" onClick={addRule}>
                      <Plus className="w-4 h-4 mr-1" />
                      Regel
                    </StyledButton>
                  </div>
                }
              >
                <div className="space-y-2">
                  {sortedRules.length === 0 && (
                    <div className="rounded-md border border-dashed border-border bg-secondary p-4 text-[0.95rem] text-muted-foreground text-center">
                      Noch keine Regeln vorhanden. Füge oben deine erste Regel hinzu, um automatische Moderationsaktionen zu aktivieren.
                    </div>
                  )}
                  {sortedRules.map((rule, idx) => (
                    <div key={`${rule.warns}-${idx}`} className="rounded-lg border border-border bg-secondary p-3 shadow-astra hover:border-astra-purple/40 transition-colors">
                      <div className="flex flex-wrap items-end gap-3">
                        {/* Warnungen */}
                        <div className="w-[100px] shrink-0">
                          <div className="mb-1 text-[0.82rem] text-muted-foreground font-medium">Warnungen</div>
                          <StyledNumberInput
                            value={rule.warns as any}
                            onChange={(e) => {
                              const raw = (e.target as any).value;
                              if (raw === '') return;
                              const n = Number(raw);
                              updateRule(idx, { warns: Number.isFinite(n) ? Math.max(1, n) : (rule.warns as any) });
                            }}
                            min={1}
                            className="w-full"
                          />
                        </div>
                        {/* Aktion */}
                        <div className="flex-1 min-w-[140px]">
                          <div className="mb-1 text-[0.82rem] text-muted-foreground font-medium">Aktion</div>
                          <StyledSelect
                            value={rule.action}
                            onChange={(val) => {
                              const patch: Partial<AutomodRule> = { action: val };
                              if (val === 'timeout' && !rule.timeout_seconds) {
                                patch.timeout_seconds = 60;
                              }
                              if (val !== 'timeout') {
                                patch.timeout_seconds = undefined;
                              }
                              updateRule(idx, patch);
                            }}
                            options={ACTION_OPTIONS}
                            placeholder="— auswählen —"
                          />
                        </div>
                        {/* Timeout-Dauer */}
                        {rule.action === 'timeout' && (
                          <div className="w-[130px] shrink-0">
                            <div className="mb-1 text-[0.82rem] text-muted-foreground font-medium">Dauer (Sek.)</div>
                            <StyledNumberInput
                              value={(rule.timeout_seconds ?? '') as any}
                              onChange={(e) =>
                                updateRule(idx, {
                                  timeout_seconds:
                                    (e.target as any).value === ''
                                      ? undefined
                                      : Math.max(0, Number((e.target as any).value)),
                                })
                              }
                              min={0}
                              className="w-full"
                            />
                          </div>
                        )}
                        {/* Entfernen-Button – immer rechts */}
                        <div className="shrink-0 ml-auto">
                          <StyledButton variant="danger" size="sm" onClick={() => removeRule(idx)} title="Regel entfernen">
                            <Trash2 className="w-4 h-4" />
                          </StyledButton>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </SettingsCard>
            </div>

            {/* Rechte Spalte */}
            <div className="space-y-4">
              {/* Profanity Status Card */}
              <SettingsCard>
                <div className="flex items-start gap-4">
                  <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border ${profanityEnabled ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-[#1d2238] border-[#353c56] text-[#9b95ff]'} transition-colors`}>
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-[1rem] font-semibold text-white">Beleidigungsfilter</h3>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[0.75rem] font-semibold ${profanityEnabled ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-[#1d2238] text-[#9ca2be] border border-[#353c56]'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${profanityEnabled ? 'bg-emerald-400' : 'bg-[#6b7194]'}`} />
                        {profanityEnabled ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </div>
                    <p className="text-[0.88rem] text-muted-foreground mb-3">
                      Erkennt Beleidigungen automatisch und berücksichtigt den Zusammenhang einer Nachricht, um harmlose Aussagen nicht unnötig zu bestrafen.
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[0.85rem] text-[#9ca2be]">Filter aktivieren</span>
                      <StyledSwitch checked={profanityEnabled} onChange={(v) => setProfanityEnabled(v)} />
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-border">
                  <div className="text-[0.82rem] font-medium text-[#dbe3ff] mb-2">Erkennungsmöglichkeiten</div>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
                    <div className="rounded-md border border-border bg-background/40 p-2">
                      <div className="text-[0.82rem] font-medium text-foreground">Automatisch</div>
                      <div className="text-[0.78rem] text-muted-foreground">Eindeutige Beleidigungen werden sofort behandelt.</div>
                    </div>
                    <div className="rounded-md border border-border bg-background/40 p-2">
                      <div className="text-[0.82rem] font-medium text-foreground">Manuell prüfen</div>
                      <div className="text-[0.78rem] text-muted-foreground">Unklare Fälle werden Moderatoren vorgelegt.</div>
                    </div>
                    <div className="rounded-md border border-border bg-background/40 p-2">
                      <div className="text-[0.82rem] font-medium text-foreground">Ignorieren</div>
                      <div className="text-[0.78rem] text-muted-foreground">Harmlose Aussagen bleiben unbeachtet.</div>
                    </div>
                  </div>
                  <p className="mt-2 text-[0.8rem] text-muted-foreground">
                    <span className="font-medium text-foreground">Mehrsprachig</span> · Unterstützt Deutsch, Englisch und weitere Sprachen.
                  </p>
                </div>
              </SettingsCard>

              {/* Capslock */}
              <SettingsCard header={
                <div>
                  <span className="text-[#dbe3ff] font-medium">Capslock-Erkennung</span>
                  <p className="text-[0.85rem] text-muted-foreground mt-0.5">Erkennt Nachrichten, die überwiegend in Großbuchstaben geschrieben wurden. Ab dem festgelegten Prozentwert kann die konfigurierte Moderationsregel greifen.</p>
                </div>
              }>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <StyledSwitch checked={capsEnabled} onChange={(v) => setCapsEnabled(v)} />
                    <span className="text-[0.9rem] text-muted-foreground">Erkennung aktivieren</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[0.85rem] text-muted-foreground whitespace-nowrap">Schwelle (%)</span>
                    <StyledNumberInput
                      value={(capsPercent as any)}
                      onChange={(e) => setCapsPercent((e.target as any).value === '' ? '' : Math.max(0, Math.min(100, Number((e.target as any).value))))}
                      min={0}
                      max={100}
                      className="w-20"
                    />
                  </div>
                </div>
              </SettingsCard>
            </div>
          </div>
        </>
      )}

      <SettingsSaveBar
        dirty={isDirty}
        saving={saveState === 'saving'}
        onSave={onSave}
        onCancel={() => {
          if (guildId) {
            setLoading(true);
            moderationApi.getAutomod(guildId).then((res) => {
              applyConfig(res.config || {});
            }).finally(() => setLoading(false));
          }
        }}
      />
    </div>
  );
};

export default AutomodPage;
