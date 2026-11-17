import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ticketsApi, type TicketConfig } from '@/services/tickets-api';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import SettingsCard from '@/components/settings/SettingsCard';
import { StyledInput } from '@/components/ui/StyledInput';
import SettingsSaveBar from '@/components/settings/SettingsSaveBar';
import { Settings2, Info } from 'lucide-react';

const TicketConfigPage: React.FC = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<TicketConfig>({});
  const [original, setOriginal] = useState<TicketConfig>({});

  useEffect(() => {
    let active = true;
    async function load() {
      if (!guildId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await ticketsApi.getConfig(guildId);
        if (!active) return;
        setConfig(res.config);
        setOriginal(res.config);
      } catch (e: any) {
        if (!active) return;
        setError(e?.message || 'Fehler beim Laden der Ticket-Konfiguration.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [guildId]);

  const dirty = JSON.stringify(config) !== JSON.stringify(original);

  const onSave = async () => {
    if (!guildId) return;
    setSaving(true);
    setError(null);
    setInfo(null);
    try {
      const res = await ticketsApi.putConfig(guildId, config);
      setOriginal(res.config);
      setConfig(res.config);
      setInfo('Konfiguration gespeichert.');
    } catch (e: any) {
      setError(e?.message || 'Speichern fehlgeschlagen.');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: string, value: unknown) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-5">
      <SettingsPageHeader
        heading="Ticket-Konfiguration"
        description="Verwalte die allgemeinen Einstellungen des Ticket-Systems für diesen Server."
        backTo={`/servers/${guildId}/modules`}
        backLabel="Modulübersicht"
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
      {info && (
        <SettingsCard>
          <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-[0.95rem] text-emerald-200">{info}</div>
        </SettingsCard>
      )}

      {!loading && !error && (
        <>
          <SettingsCard header={
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-astra-accent" />
              <span className="text-[#dbe3ff] font-medium">Allgemeine Einstellungen</span>
            </div>
          }>
            <div className="space-y-4">
              {Object.keys(config).length === 0 ? (
                <div className="flex items-start gap-3 rounded-lg border border-[#2a2d4a] bg-[#13152a]/60 p-4">
                  <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#8b8fad]" />
                  <p className="text-[0.9rem] leading-relaxed text-[#8b8fad]">
                    Keine Konfigurationsfelder verfügbar. Die Konfiguration wird von der Astra-API bereitgestellt.
                  </p>
                </div>
              ) : (
                Object.entries(config).map(([key, value]) => (
                  <div key={key} className="space-y-1.5">
                    <label className="block text-[0.85rem] font-medium text-[#c1c7de]">
                      {key}
                    </label>
                    {typeof value === 'boolean' ? (
                      <button
                        type="button"
                        onClick={() => updateField(key, !value)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                          value ? 'bg-astra-accent' : 'bg-[#2a2d4a]'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform duration-200 ${
                            value ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    ) : typeof value === 'number' ? (
                      <StyledInput
                        type="number"
                        value={String(value)}
                        onChange={e => updateField(key, Number(e.target.value))}
                      />
                    ) : (
                      <StyledInput
                        value={String(value ?? '')}
                        onChange={e => updateField(key, e.target.value)}
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          </SettingsCard>

          <SettingsSaveBar
            dirty={dirty}
            saving={saving}
            onSave={onSave}
            onCancel={() => setConfig(original)}
          />
        </>
      )}
    </div>
  );
};

export default TicketConfigPage;
