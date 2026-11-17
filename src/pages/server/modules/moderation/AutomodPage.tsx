import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { moderationApi } from '@/services/moderation-api';
import type { AutomodConfig, AutomodRule } from '@/types/moderation';

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
  const [blWords, setBlWords] = useState<string>('');

  const buildConfig = useCallback((): AutomodConfig => {
    const words = blWords
      .split(/\r?\n|,/) // allow comma or newline separated
      .map((w) => w.trim())
      .filter(Boolean);

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
        if (Array.isArray(rawRules)) {
          nextRules = rawRules
            .map((r) => ({
              warns: Number(r?.warns ?? 0),
              action: String(r?.action ?? ''),
              ...(r?.timeout_seconds != null ? { timeout_seconds: Number(r.timeout_seconds) } : {}),
            }))
            .filter((r) => r.warns > 0 && r.action);
        } else if (rawRules && typeof rawRules === 'object') {
          nextRules = [{
            warns: Number(rawRules.warns ?? 0),
            action: String(rawRules.action ?? ''),
            ...(rawRules.timeout_seconds != null ? { timeout_seconds: Number(rawRules.timeout_seconds) } : {}),
          }].filter((r) => r.warns > 0 && r.action);
        }
        nextRules.sort((a, b) => a.warns - b.warns);
        setRules(nextRules);
        setCapsEnabled(Boolean(cfg.capslock?.enabled));
        setCapsPercent(cfg.capslock?.percent ?? '');
        setBlEnabled(Boolean(cfg.blacklist?.enabled));
        setBlWords((cfg.blacklist?.words || []).join('\n'));
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
          nextRules = rawRules as AutomodRule[];
        } else if (rawRules && typeof rawRules === 'object') {
          nextRules = [rawRules as AutomodRule];
        }
        setRules((nextRules || []).sort((a, b) => a.warns - b.warns));
        setCapsEnabled(Boolean(cfg.capslock?.enabled));
        setCapsPercent(cfg.capslock?.percent ?? '');
        setBlEnabled(Boolean(cfg.blacklist?.enabled));
        setBlWords((cfg.blacklist?.words || []).join('\n'));
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
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-white">AutoMod</h2>
        <p className="text-sm text-foreground/70">Konfiguration der automatischen Moderationsfunktionen.</p>
      </div>

      {loading && (
        <div className="rounded-lg border border-layout-divider bg-black/20 p-4 text-sm text-foreground/70">Wird geladen…</div>
      )}
      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Übersicht */}
          <section className="rounded-lg border border-layout-divider bg-black/20 p-4">
            <h3 className="mb-3 text-sm font-semibold text-white">Übersicht</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border border-layout-divider bg-[#0b0e1a] p-3">
                <div className="text-foreground/70">Regeln</div>
                <div className="mt-1 text-lg font-semibold text-white">{rules.length}</div>
              </div>
              <div className="rounded-md border border-layout-divider bg-[#0b0e1a] p-3">
                <div className="text-foreground/70">Capslock</div>
                <div className="mt-1 text-lg font-semibold text-white">{capsEnabled ? 'Aktiv' : 'Inaktiv'}</div>
              </div>
              <div className="rounded-md border border-layout-divider bg-[#0b0e1a] p-3 col-span-2">
                <div className="text-foreground/70">Blacklist</div>
                <div className="mt-1 text-lg font-semibold text-white">{blEnabled ? `${blWords.split(/\r?\n|,/).filter((w)=>w.trim()).length} Wörter` : 'Inaktiv'}</div>
              </div>
            </div>
          </section>

          {/* Capslock */}
          <section className="rounded-lg border border-layout-divider bg-black/20 p-4">
            <h3 className="mb-3 text-sm font-semibold text-white">Capslock</h3>
            <div className="space-y-3 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={capsEnabled} onChange={(e) => setCapsEnabled(e.target.checked)} />
                <span className="text-foreground/80">Capslock‑Erkennung aktivieren</span>
              </label>
              <label className="block">
                <span className="mb-1 block text-foreground/70">Prozent‑Schwelle</span>
                <input
                  type="number"
                  className="w-full rounded-md border border-layout-divider bg-[#0b0e1a] px-3 py-2 text-white outline-none focus:border-[#4b46c8]"
                  value={capsPercent}
                  onChange={(e) => setCapsPercent(e.target.value === '' ? '' : Number(e.target.value))}
                  min={0}
                  max={100}
                />
              </label>
            </div>
          </section>

          {/* Regeln */}
          <section className="rounded-lg border border-layout-divider bg-black/20 p-4 lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Moderationsregeln</h3>
              <button
                type="button"
                onClick={addRule}
                className="inline-flex items-center rounded-md border border-layout-divider bg-[#101428] px-3 py-1.5 text-sm text-white hover:bg-[#151b34]"
              >
                + Regel hinzufügen
              </button>
            </div>
            <div className="space-y-3">
              {sortedRules.length === 0 && (
                <div className="rounded-md border border-dashed border-layout-divider bg-[#0b0e1a] p-4 text-sm text-foreground/70">
                  Noch keine Regeln. Füge oben deine erste Regel hinzu.
                </div>
              )}
              {sortedRules.map((rule, idx) => (
                <div key={`${rule.warns}-${idx}`} className="rounded-lg border border-[#2a2f45] bg-[#0f1220] p-3">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-[140px_1fr_200px_auto] md:items-end">
                    <label className="block text-sm">
                      <span className="mb-1 block text-foreground/70">Warnungen</span>
                      <input
                        type="number"
                        className="w-full rounded-md border border-layout-divider bg-[#0b0e1a] px-3 py-2 text-white outline-none focus:border-[#4b46c8]"
                        value={rule.warns}
                        onChange={(e) => updateRule(idx, { warns: Math.max(0, Number(e.target.value || 0)) })}
                        min={0}
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block text-foreground/70">Aktion</span>
                      <select
                        className="w-full appearance-none rounded-md border border-layout-divider bg-[#0b0e1a] px-3 py-2 text-white outline-none focus:border-[#4b46c8]"
                        value={rule.action}
                        onChange={(e) => updateRule(idx, { action: e.target.value })}
                      >
                        <option value="">— auswählen —</option>
                        <option value="timeout">Timeout</option>
                        <option value="kick">Kick</option>
                        <option value="ban">Ban</option>
                      </select>
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block text-foreground/70">Timeout (Sek.)</span>
                      <input
                        type="number"
                        className="w-full rounded-md border border-layout-divider bg-[#0b0e1a] px-3 py-2 text-white outline-none focus:border-[#4b46c8] disabled:opacity-50"
                        value={rule.timeout_seconds ?? ''}
                        onChange={(e) => updateRule(idx, { timeout_seconds: e.target.value === '' ? undefined : Math.max(0, Number(e.target.value)) })}
                        min={0}
                        disabled={rule.action !== 'timeout'}
                      />
                    </label>
                    <div className="flex justify-end md:justify-start">
                      <button
                        type="button"
                        onClick={() => removeRule(idx)}
                        className="inline-flex items-center rounded-md border border-[#3a2a31] bg-[#1a0f12] px-3 py-2 text-sm text-[#ffb4c0] hover:bg-[#2a151a]"
                      >
                        Entfernen
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-layout-divider bg-black/20 p-4">
            <h3 className="mb-3 text-sm font-semibold text-white">Capslock</h3>
            <div className="space-y-3 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={capsEnabled} onChange={(e) => setCapsEnabled(e.target.checked)} />
                <span className="text-foreground/80">Capslock‑Erkennung aktivieren</span>
              </label>
              <label className="block">
                <span className="mb-1 block text-foreground/70">Prozent‑Schwelle</span>
                <input
                  type="number"
                  className="w-full rounded-md border border-layout-divider bg-[#0b0e1a] px-3 py-2 text-white outline-none focus:border-[#4b46c8]"
                  value={capsPercent}
                  onChange={(e) => setCapsPercent(e.target.value === '' ? '' : Number(e.target.value))}
                  min={0}
                  max={100}
                />
              </label>
            </div>
          </section>

          <section className="rounded-lg border border-layout-divider bg-black/20 p-4 lg:col-span-2">
            <h3 className="mb-3 text-sm font-semibold text-white">Blacklist</h3>
            <div className="space-y-3 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={blEnabled} onChange={(e) => setBlEnabled(e.target.checked)} />
                <span className="text-foreground/80">Blacklist aktivieren</span>
              </label>
              <label className="block">
                <span className="mb-1 block text-foreground/70">Wörter (je Zeile oder mit Komma trennen)</span>
                <textarea
                  className="min-h-[120px] w-full rounded-md border border-layout-divider bg-[#0b0e1a] px-3 py-2 text-white outline-none focus:border-[#4b46c8]"
                  value={blWords}
                  onChange={(e) => setBlWords(e.target.value)}
                />
              </label>
            </div>
          </section>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={onSave}
          disabled={loading || saveState === 'saving' || !isDirty}
          className="inline-flex items-center rounded-md bg-[#4b46c8] px-4 py-2 text-sm font-medium text-white hover:bg-[#3e39b0] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saveState === 'saving' ? 'Speichern…' : saveState === 'success' ? 'Gespeichert' : 'Änderungen speichern'}
        </button>
        {saveState === 'error' && <span className="text-sm text-red-300">Fehler beim Speichern.</span>}
      </div>
    </div>
  );
};

export default AutomodPage;
