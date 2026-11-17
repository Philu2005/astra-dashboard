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
import { StyledTextarea } from '@/components/ui/StyledTextarea';
import { StyledButton } from '@/components/ui/StyledButton';
import { StyledBadge } from '@/components/ui/StyledBadge';
import { StatCard } from '@/components/StatCard';
import { Ban, CaseSensitive, ListChecks } from 'lucide-react';

type SaveState = 'idle' | 'saving' | 'success' | 'error';

const AutomodPage: React.FC = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  const [rules, setRules] = useState<AutomodRule[]>([]);

  const [capsEnabled, setCapsEnabled] = useState<boolean>(false);
  const [capsPercent, setCapsPercent] = useState<number | ''>('');

  const [blEnabled, setBlEnabled] = useState<boolean>(false);
  const [blWords, setBlWords] = useState<string>(''); // textarea fallback (kept for compatibility)
  const [blList, setBlList] = useState<string[]>([]);
  const [blNew, setBlNew] = useState<string>('');

  const ACTION_OPTIONS = useMemo(
    () => [
      { value: 'timeout', label: 'Timeout' },
      { value: 'kick', label: 'Kick' },
      { value: 'ban', label: 'Ban' },
    ],
    [],
  );

  const buildConfig = useCallback((): AutomodConfig => {
    const words = (blList.length
      ? blList
      : blWords
          .split(/\r?\n|,/)
          .map((w) => w.trim())
          .filter(Boolean)
    );

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
      blacklist: {
        enabled: blEnabled,
        words: words.length ? words : undefined,
      },
    };
  }, [rules, capsEnabled, capsPercent, blEnabled, blWords]);

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
        setBlEnabled(Boolean(cfg.blacklist?.enabled));
        const words = (cfg.blacklist?.words || []).map((w: any) => String(w).trim()).filter(Boolean);
        setBlList(words);
        setBlWords(words.join('\n'));
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
        setBlEnabled(Boolean(cfg.blacklist?.enabled));
        const words = (cfg.blacklist?.words || []).map((w: any) => String(w).trim()).filter(Boolean);
        setBlList(words);
        setBlWords(words.join('\n'));
        // Snapshot nach erfolgreichem Speichern auf neuen Serverzustand aktualisieren
        const snap = JSON.stringify({
          rules: (nextRules || []).sort((a, b) => a.warns - b.warns),
          capsEnabled: Boolean(cfg.capslock?.enabled),
          capsPercent: cfg.capslock?.percent ?? '',
          blEnabled: Boolean(cfg.blacklist?.enabled),
          blWords: words.join('\n'),
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
      const snap = JSON.stringify({ rules, capsEnabled, capsPercent, blEnabled, blWords });
      if (!initialSnapshot) setInitialSnapshot(snap);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const isDirty = useMemo(() => {
    const current = JSON.stringify({ rules, capsEnabled, capsPercent, blEnabled, blWords });
    return current !== initialSnapshot;
  }, [rules, capsEnabled, capsPercent, blEnabled, blWords, initialSnapshot]);

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
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,68fr)_minmax(380px,32fr)]">
          <div className="space-y-5">
            {/* Übersicht */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <StatCard title="Regeln" value={String(rules.length)} icon={ListChecks} />
              <StatCard title="Capslock" value={capsEnabled ? 'Aktiv' : 'Inaktiv'} icon={CaseSensitive} />
              <StatCard title="Blacklist" value={blEnabled ? `${(blList.length || blWords.split(/\r?\n|,/).filter((w)=>w.trim()).length)} Wörter` : 'Inaktiv'} icon={Ban} />
            </div>

            {/* Regeln */}
            <SettingsCard
              header={<div className="flex items-center justify-between"><span className="text-[#dbe3ff]">Moderationsregeln</span><StyledButton variant="secondary" size="sm" onClick={addRule}>+ Regel hinzufügen</StyledButton></div>}
            >
              <div className="space-y-3">
                {sortedRules.length === 0 && (
                  <div className="rounded-md border border-dashed border-[#333a55] bg-[#0f1220] p-4 text-[0.95rem] text-[#9ca2be]">
                    Noch keine Regeln. Füge oben deine erste Regel hinzu.
                  </div>
                )}
                {sortedRules.map((rule, idx) => (
                  <div key={`${rule.warns}-${idx}`} className="rounded-[0.9rem] border border-[#2a2f45] bg-[#0f1220] p-3 shadow-astra hover:border-astra-purple/40 transition-colors">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-[160px_1fr_220px_auto] md:items-end">
                      <div>
                        <div className="mb-1 text-[0.9rem] text-[#9ca2be]">Warnungen</div>
                        <StyledNumberInput
                          value={rule.warns as any}
                          onChange={(e) => updateRule(idx, { warns: Math.max(0, Number((e.target as any).value || 0)) })}
                          min={0}
                        />
                      </div>
                      <div>
                        <div className="mb-1 text-[0.9rem] text-[#9ca2be]">Aktion</div>
                        <StyledSelect
                          value={rule.action}
                          onChange={(val) => updateRule(idx, { action: val })}
                          options={ACTION_OPTIONS}
                          placeholder="— auswählen —"
                        />
                      </div>
                      <div>
                        <div className="mb-1 text-[0.9rem] text-[#9ca2be]">Timeout (Sek.)</div>
                        <StyledNumberInput
                          value={(rule.timeout_seconds ?? '') as any}
                          onChange={(e) => updateRule(idx, { timeout_seconds: (e.target as any).value === '' ? undefined : Math.max(0, Number((e.target as any).value)) })}
                          min={0}
                          disabled={rule.action !== 'timeout'}
                        />
                      </div>
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

            {/* Blacklist */}
            <SettingsCard header={<span className="text-[#dbe3ff]">Blacklist</span>}>
              <SettingsSection
                heading={<span className="text-[#dbe3ff]">Blacklist aktivieren</span>}
                description="Wenn aktiviert, werden Nachrichten mit gelisteten Wörtern moderiert."
              >
                <StyledSwitch checked={blEnabled} onChange={(v) => setBlEnabled(v)} />
              </SettingsSection>
              <div className="h-3" />
              <SettingsSection heading={<span className="text-[#dbe3ff]">Wörter</span>} description="Einzeln hinzufügen und entfernen.">
                <div className="flex flex-wrap gap-2">
                  {(blList.length ? blList : blWords.split(/\r?\n|,/).map((w)=>w.trim()).filter(Boolean)).map((w, i) => (
                    <span
                      key={`${w}-${i}`}
                      className="inline-flex items-center gap-2 rounded-full border border-[#333a55] bg-[#14182d] px-3 py-1 text-[0.88rem] text-[#dbe3ff] shadow-astra transition-colors hover:border-astra-purple/40"
                    >
                      {w}
                      <button
                        type="button"
                        onClick={() => {
                          const list = (blList.length ? blList : blWords.split(/\r?\n|,/).map((t)=>t.trim()).filter(Boolean));
                          const next = list.filter((_, j) => j !== i);
                          setBlList(next);
                          setBlWords(next.join('\n'));
                        }}
                        className="ml-1 rounded-full border border-[#3a2a31] bg-[#1a0f12] px-1.5 py-0.5 text-[#ffb4c0] hover:bg-[#2a151a]"
                        aria-label={`Wort ${w} entfernen`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <StyledTextarea
                    placeholder="Wörter hier einfügen (Zeilenumbruch oder Komma)"
                    value={blNew}
                    onChange={(e) => setBlNew(e.target.value)}
                    rows={2 as any}
                    className="flex-1"
                  />
                  <StyledButton
                    variant="secondary"
                    onClick={() => {
                      const added = blNew
                        .split(/\r?\n|,/) 
                        .map((w) => w.trim())
                        .filter(Boolean);
                      if (!added.length) return;
                      const base = (blList.length ? blList : blWords.split(/\r?\n|,/).map((t)=>t.trim()).filter(Boolean));
                      const combined = Array.from(new Set([...base, ...added]));
                      setBlList(combined);
                      setBlWords(combined.join('\n'));
                      setBlNew('');
                    }}
                  >
                    Hinzufügen
                  </StyledButton>
                </div>
              </SettingsSection>
            </SettingsCard>
          </div>

          {/* rechte Spalte: Capslock */}
          <div className="space-y-5">
            <SettingsCard header={<span className="text-[#dbe3ff]">Capslock</span>}>
              <SettingsSection
                heading={<span className="text-[#dbe3ff]">Capslock‑Erkennung aktivieren</span>}
                description="Erkennt Nachrichten mit hohem Großbuchstaben‑Anteil."
              >
                <StyledSwitch checked={capsEnabled} onChange={(v) => setCapsEnabled(v)} />
              </SettingsSection>
              <div className="h-3" />
              <SettingsSection
                heading={<span className="text-[#dbe3ff]">Prozent‑Schwelle</span>}
                description="Ab diesem Großbuchstaben‑Anteil greift die Regel."
              >
                <StyledNumberInput
                  value={(capsPercent as any)}
                  onChange={(e) => setCapsPercent((e.target as any).value === '' ? '' : Math.max(0, Math.min(100, Number((e.target as any).value))))}
                  min={0}
                  max={100}
                />
              </SettingsSection>
            </SettingsCard>
          </div>
        </div>
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
              setBlEnabled(Boolean(cfg.blacklist?.enabled));
              const words = (cfg.blacklist?.words || []).map((w: any) => String(w).trim()).filter(Boolean);
              setBlList(words);
              setBlWords(words.join('\n'));
            }).finally(() => setLoading(false));
          }
        }}
      />
    </div>
  );
};

export default AutomodPage;
