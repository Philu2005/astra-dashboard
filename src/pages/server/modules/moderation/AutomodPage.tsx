import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { moderationApi } from '@/services/moderation-api';
import type { AutomodConfig } from '@/types/moderation';

type SaveState = 'idle' | 'saving' | 'success' | 'error';

const AutomodPage: React.FC = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  const [rulesWarns, setRulesWarns] = useState<number | ''>('');
  const [rulesAction, setRulesAction] = useState<string>('');
  const [rulesTimeout, setRulesTimeout] = useState<number | ''>('');

  const [capsEnabled, setCapsEnabled] = useState<boolean>(false);
  const [capsPercent, setCapsPercent] = useState<number | ''>('');

  const [blEnabled, setBlEnabled] = useState<boolean>(false);
  const [blWords, setBlWords] = useState<string>('');

  const buildConfig = useCallback((): AutomodConfig => {
    return {
      rules: {
        warns: rulesWarns === '' ? undefined : Number(rulesWarns),
        action: rulesAction || undefined,
        timeout_seconds: rulesTimeout === '' ? undefined : Number(rulesTimeout),
      },
      capslock: {
        enabled: capsEnabled,
        percent: capsPercent === '' ? undefined : Number(capsPercent),
      },
      blacklist: {
        enabled: blEnabled,
        words:
          blWords
            .split(/\r?\n|,/) // allow comma or newline separated
            .map((w) => w.trim())
            .filter(Boolean) || undefined,
      },
    };
  }, [rulesWarns, rulesAction, rulesTimeout, capsEnabled, capsPercent, blEnabled, blWords]);

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
        setRulesWarns(cfg.rules?.warns ?? '');
        setRulesAction(cfg.rules?.action ?? '');
        setRulesTimeout(cfg.rules?.timeout_seconds ?? '');
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
    } catch (e: any) {
      setSaveState('error');
      setError(e?.message || 'Speichern fehlgeschlagen.');
    }
  };

  const isDirty = useMemo(() => true, [rulesWarns, rulesAction, rulesTimeout, capsEnabled, capsPercent, blEnabled, blWords]);

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
          <section className="rounded-lg border border-layout-divider bg-black/20 p-4">
            <h3 className="mb-3 text-sm font-semibold text-white">Regeln</h3>
            <div className="space-y-3 text-sm">
              <label className="block">
                <span className="mb-1 block text-foreground/70">Verwarnungen bis Aktion</span>
                <input
                  type="number"
                  className="w-full rounded-md border border-layout-divider bg-[#0b0e1a] px-3 py-2 text-white outline-none focus:border-[#4b46c8]"
                  value={rulesWarns}
                  onChange={(e) => setRulesWarns(e.target.value === '' ? '' : Number(e.target.value))}
                  min={0}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-foreground/70">Aktion (z. B. timeout, mute)</span>
                <input
                  type="text"
                  className="w-full rounded-md border border-layout-divider bg-[#0b0e1a] px-3 py-2 text-white outline-none focus:border-[#4b46c8]"
                  value={rulesAction}
                  onChange={(e) => setRulesAction(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-foreground/70">Timeout‑Dauer (Sekunden)</span>
                <input
                  type="number"
                  className="w-full rounded-md border border-layout-divider bg-[#0b0e1a] px-3 py-2 text-white outline-none focus:border-[#4b46c8]"
                  value={rulesTimeout}
                  onChange={(e) => setRulesTimeout(e.target.value === '' ? '' : Number(e.target.value))}
                  min={0}
                />
              </label>
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
