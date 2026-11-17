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
// Entfernt: Textarea/Input für manuelle Blacklist
import { StyledButton } from '@/components/ui/StyledButton';
import { StyledBadge } from '@/components/ui/StyledBadge';
import { StatCard } from '@/components/StatCard';
import { CaseSensitive, ListChecks } from 'lucide-react';

type SaveState = 'idle' | 'saving' | 'success' | 'error';

const AutomodPage: React.FC = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  const [rules, setRules] = useState<AutomodRule[]>([]);

  const [capsEnabled, setCapsEnabled] = useState<boolean>(false);
  const [capsPercent, setCapsPercent] = useState<number | ''>('');

  // Beleidigungsfilter (Profinity) – nur Aktivierung sichtbar/änderbar
  const [profanityEnabled, setProfanityEnabled] = useState<boolean>(false);

  // Manuelle AutoMod‑Blacklist: vollständig entfernt (UI/State)

  const ACTION_OPTIONS = useMemo(
    () => [
      { value: 'timeout', label: 'Timeout' },
      { value: 'kick', label: 'Kick' },
      { value: 'ban', label: 'Ban' },
    ],
    [],
  );

  const buildConfig = useCallback((): AutomodConfig => {
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
        percent: capsPercent === '' ? undefined : Number(capsPercent),
      },
      profanity: {
        enabled: Boolean(profanityEnabled),
      },
    };
  }, [rules, capsEnabled, capsPercent, profanityEnabled]);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!guildId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await moderationApi.getAutomod(guildId);
        if (!active) return;
        const cfg = res.config || {};
        // Regeln normalisieren: Array bevorzugt, einzelnes Objekt bleibt kompatibel
        const rawRules: any = (cfg as any).rules;
        let nextRules: AutomodRule[] = [];
        const normalizeAction = (a: any): string => {
          const v = String(a ?? '').toLowerCase();
          return ['timeout', 'kick', 'ban'].includes(v) ? v : '';
        };
        if (Array.isArray(rawRules)) {
          nextRules = rawRules
            .map((r) => ({
              warns: Number(r?.warns ?? 0),
              action: normalizeAction(r?.action),
              ...(r?.timeout_seconds != null ? { timeout_seconds: Number(r.timeout_seconds) } : {}),
            }))
            .filter((r) => r.warns > 0 && r.action);
        } else if (rawRules && typeof rawRules === 'object') {
          nextRules = [{
            warns: Number(rawRules.warns ?? 0),
            action: normalizeAction(rawRules.action),
            ...(rawRules.timeout_seconds != null ? { timeout_seconds: Number(rawRules.timeout_seconds) } : {}),
          }].filter((r) => r.warns > 0 && r.action);
        }
        nextRules.sort((a, b) => a.warns - b.warns);
        setRules(nextRules);
        setCapsEnabled(Boolean(cfg.capslock?.enabled));
        setCapsPercent(cfg.capslock?.percent ?? '');
        // Profanity: tolerant lesen (optional)
        setProfanityEnabled(Boolean((cfg as any).profanity?.enabled ?? (cfg as any).profanity_enabled ?? false));
        // Blacklist-UI entfernt – Backend-Zustände werden nicht dargestellt
      } catch (e: any) {
        if (!active) return;
        setError(e?.message || 'Fehler beim Laden der AutoMod‑Konfiguration.');
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
    setSaveState('saving');
    setError(null);
    try {
      const payload = buildConfig();
      await moderationApi.putAutomod(guildId, payload);
      setSaveState('success');
      // Soft reset success state after short delay
      setTimeout(() => setSaveState('idle'), 1600);
      // Nach erfolgreichem Speichern vom Server neu laden, um echten Zustand zu übernehmen
      try {
        const fresh = await moderationApi.getAutomod(guildId);
        const cfg = fresh.config || {};
        const rawRules: any = (cfg as any).rules;
        let nextRules: AutomodRule[] = [];
        if (Array.isArray(rawRules)) {
          nextRules = (rawRules as any[]).map((r) => ({
            warns: Number(r?.warns ?? 0),
            action: String(r?.action ?? '').toLowerCase(),
            ...(r?.timeout_seconds != null ? { timeout_seconds: Number(r.timeout_seconds) } : {}),
          }));
        } else if (rawRules && typeof rawRules === 'object') {
          nextRules = [{
            warns: Number((rawRules as any).warns ?? 0),
            action: String((rawRules as any).action ?? '').toLowerCase(),
            ...(((rawRules as any).timeout_seconds != null) ? { timeout_seconds: Number((rawRules as any).timeout_seconds) } : {}),
          }];
        }
        setRules((nextRules || []).sort((a, b) => a.warns - b.warns));
        setCapsEnabled(Boolean(cfg.capslock?.enabled));
        setCapsPercent(cfg.capslock?.percent ?? '');
        setProfanityEnabled(Boolean((cfg as any).profanity?.enabled ?? (cfg as any).profanity_enabled ?? false));
        // Snapshot nach erfolgreichem Speichern auf neuen Serverzustand aktualisieren
        const snap = JSON.stringify({
          rules: (nextRules || []).sort((a, b) => a.warns - b.warns),
          capsEnabled: Boolean(cfg.capslock?.enabled),
          capsPercent: cfg.capslock?.percent ?? '',
          profanityEnabled: Boolean((cfg as any).profanity?.enabled ?? (cfg as any).profanity_enabled ?? false),
        } as any);
        setInitialSnapshot(snap);
      } catch {
        // still fine – Nutzer sieht success, erneutes Laden kann später erfolgen
      }
    } catch (e: any) {
      setSaveState('error');
      setError(e?.message || 'Speichern fehlgeschlagen.');
    }
  };

  const [initialSnapshot, setInitialSnapshot] = useState<string>('');
  useEffect(() => {
    // Set initial snapshot, sobald erste Ladung fertig ist
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
        description="Konfiguriere die automatischen Moderationsfunktionen für deinen Server."
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
          {/* Statistik: volle Breite, kompakter Abstand */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard title="Regeln" value={String(rules.length)} icon={ListChecks} />
            <StatCard title="Capslock" value={capsEnabled ? 'Aktiv' : 'Inaktiv'} icon={CaseSensitive} />
          </div>

          {/* Hauptlayout: 2 Spalten, rechte Spalte nutzt freie Fläche */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,60%)_1fr]">
            {/* Linke Spalte: Regeln */}
            <div className="space-y-4">
              <SettingsCard
                header={<div className="flex items-center justify-between"><span className="text-[#dbe3ff]">Moderationsregeln</span><StyledButton variant="secondary" size="sm" onClick={addRule}>+ Regel hinzufügen</StyledButton></div>}
              >
                <div className="space-y-2">
                  {sortedRules.length === 0 && (
                    <div className="rounded-md border border-dashed border-border bg-secondary p-3 text-[0.95rem] text-muted-foreground">
                      Noch keine Regeln. Füge oben deine erste Regel hinzu.
                    </div>
                  )}
                  {sortedRules.map((rule, idx) => (
                    <div key={`${rule.warns}-${idx}`} className="rounded-lg border border-border bg-secondary p-2.5 shadow-astra hover:border-astra-purple/40 transition-colors">
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-[120px_1fr_auto] md:items-end">
                        <div>
                          <div className="mb-0.5 text-[0.88rem] text-muted-foreground">Warnungen</div>
                          <StyledNumberInput
                            value={rule.warns as any}
                            onChange={(e) => {
                              const raw = (e.target as any).value;
                              // Leere Eingabe nicht sofort erzwingen – min. 1 bei gültiger Zahl
                              if (raw === '') {
                                // Nichts verändern; Auswahl + anschließende Eingabe überschreibt zuverlässig
                                return;
                              }
                              const n = Number(raw);
                              updateRule(idx, { warns: Number.isFinite(n) ? Math.max(1, n) : (rule.warns as any) });
                            }}
                            min={1}
                            className="w-20"
                          />
                        </div>
                        <div>
                          <div className="mb-0.5 text-[0.88rem] text-muted-foreground">Aktion</div>
                          <StyledSelect
                            value={rule.action}
                            onChange={(val) => updateRule(idx, { action: val })}
                            options={ACTION_OPTIONS}
                            placeholder="— auswählen —"
                          />
                        </div>
                        {rule.action === 'timeout' && (
                          <div className="md:col-span-1">
                            <div className="mb-0.5 text-[0.88rem] text-muted-foreground">Timeout‑Dauer (Sek.)</div>
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
                              className="w-24"
                            />
                          </div>
                        )}
                        <div className="flex justify-end md:justify-start">
                          <StyledButton variant="danger" size="sm" onClick={() => removeRule(idx)}>
                            Entfernen
                          </StyledButton>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </SettingsCard>
            </div>

            {/* Rechte Spalte: Beleidigungsfilter oben, Capslock darunter */}
            <div className="space-y-4">
              {/* Beleidigungsfilter */}
              <SettingsCard header={<span className="text-[#dbe3ff]">Beleidigungsfilter</span>}>
                <div className="mb-2 text-[0.95rem] text-muted-foreground">
                  Erkennt Beleidigungen automatisch und berücksichtigt den Zusammenhang einer Nachricht, um harmlose Aussagen nicht unnötig zu bestrafen.
                </div>
                <SettingsSection
                  heading="Beleidigungsfilter aktivieren"
                  description="Schützt deinen Server automatisch vor Beleidigungen und Schimpfwörtern."
                >
                  <div className="flex items-center justify-end">
                    <StyledSwitch checked={profanityEnabled} onChange={(v) => setProfanityEnabled(v)} />
                  </div>
                </SettingsSection>

                <div className="mt-3 rounded-md border border-border bg-secondary p-3">
                  <div className="mb-1.5 text-[0.95rem] font-medium text-[#dbe3ff]">Wie funktioniert die Erkennung?</div>
                  <div className="text-[0.92rem] text-muted-foreground">Der Filter erkennt Beleidigungen in mehreren Sprachen und berücksichtigt den Kontext, in dem sie verwendet werden.</div>
                  <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-3">
                    <div className="rounded-md border border-border bg-background/40 p-2">
                      <div className="text-[0.9rem] font-medium text-foreground">Automatisch moderieren</div>
                      <div className="text-[0.88rem] text-muted-foreground">Eindeutige Beleidigungen werden automatisch behandelt.</div>
                    </div>
                    <div className="rounded-md border border-border bg-background/40 p-2">
                      <div className="text-[0.9rem] font-medium text-foreground">Manuell überprüfen</div>
                      <div className="text-[0.88rem] text-muted-foreground">Unklare Nachrichten werden Moderatoren zur Prüfung vorgelegt.</div>
                    </div>
                    <div className="rounded-md border border-border bg-background/40 p-2">
                      <div className="text-[0.9rem] font-medium text-foreground">Ignorieren</div>
                      <div className="text-[0.88rem] text-muted-foreground">Harmlose oder nicht beleidigend gemeinte Aussagen bleiben unbeachtet.</div>
                    </div>
                  </div>
                  <div className="mt-2 text-[0.85rem] text-muted-foreground">
                    <span className="font-medium text-foreground">Mehrsprachige Erkennung</span>
                    <span className="ml-1">· Unterstützt Deutsch, Englisch und weitere Sprachen sowie unterschiedliche Schreibweisen.</span>
                  </div>
                </div>
              </SettingsCard>

              <SettingsCard header={<span className="text-[#dbe3ff]">Capslock</span>}>
                <div className="flex flex-col gap-2 md:flex-row md:items-end">
                  <div className="flex items-center gap-2.5">
                    <StyledSwitch checked={capsEnabled} onChange={(v) => setCapsEnabled(v)} />
                    <div className="text-[0.9rem] text-muted-foreground">Erkennung aktivieren</div>
                  </div>
                  <div className="md:ml-auto">
                    <div className="mb-0.5 text-[0.88rem] text-muted-foreground">Prozent‑Schwelle</div>
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

              {/* Blacklist-UI vollständig entfernt gemäß Anforderungen */}
            </div>
          </div>
        </>
      )}

      <SettingsSaveBar
        dirty={isDirty}
        saving={saveState === 'saving'}
        onSave={onSave}
        onCancel={() => {
          // Reset auf Initialzustand durch Neuladen
          if (guildId) {
            setLoading(true);
            moderationApi.getAutomod(guildId).then((res) => {
              const cfg = res.config || {};
              const rawRules: any = (cfg as any).rules;
              const normalizeAction = (a: any): string => {
                const v = String(a ?? '').toLowerCase();
                return ['timeout', 'kick', 'ban'].includes(v) ? v : '';
              };
              let nextRules: AutomodRule[] = [];
              if (Array.isArray(rawRules)) {
                nextRules = rawRules
                  .map((r) => ({
                    warns: Number(r?.warns ?? 0),
                    action: normalizeAction(r?.action),
                    ...(r?.timeout_seconds != null ? { timeout_seconds: Number(r.timeout_seconds) } : {}),
                  }))
                  .filter((r) => r.warns > 0 && r.action);
              } else if (rawRules && typeof rawRules === 'object') {
                nextRules = [{
                  warns: Number(rawRules.warns ?? 0),
                  action: normalizeAction(rawRules.action),
                  ...(rawRules.timeout_seconds != null ? { timeout_seconds: Number(rawRules.timeout_seconds) } : {}),
                }].filter((r) => r.warns > 0 && r.action);
              }
              nextRules.sort((a, b) => a.warns - b.warns);
              setRules(nextRules);
              setCapsEnabled(Boolean(cfg.capslock?.enabled));
              setCapsPercent(cfg.capslock?.percent ?? '');
              setProfanityEnabled(Boolean((cfg as any).profanity?.enabled ?? (cfg as any).profanity_enabled ?? false));
            }).finally(() => setLoading(false));
          }
        }}
      />
    </div>
  );
};

export default AutomodPage;
