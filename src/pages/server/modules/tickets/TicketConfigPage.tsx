import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ticketsApi, type TicketConfig } from '@/services/tickets-api';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import SettingsCard from '@/components/settings/SettingsCard';
import { StyledInput } from '@/components/ui/StyledInput';
import SettingsSaveBar from '@/components/settings/SettingsSaveBar';
import DurationPicker from '@/components/ui/DurationPicker';
import { Clock, Bell, RotateCcw, Info } from 'lucide-react';

/* ── Feld-Metadaten ─────────────────────────────────────────────── */

interface FieldMeta {
  label: string;
  description: string;
  unit?: string;
  min?: number;
  max?: number;
  group: string;
}

const FIELD_META: Record<string, FieldMeta> = {
  autoclose_hours: {
    label: 'Automatisches Schließen',
    description:
      'Tickets werden automatisch geschlossen, wenn innerhalb dieser Zeitspanne keine neue Nachricht geschrieben wird.',
    unit: 'Stunden',
    min: 0,
    max: 720,
    group: 'lifecycle',
  },
  reopen_hours: {
    label: 'Wiederöffnungsfrist',
    description:
      'Geschlossene Tickets können innerhalb dieser Frist vom Ersteller wieder geöffnet werden. Nach Ablauf ist keine Wiederöffnung mehr möglich.',
    unit: 'Stunden',
    min: 0,
    max: 720,
    group: 'lifecycle',
  },
  remind_minutes: {
    label: 'Erinnerungsintervall',
    description:
      'Wenn ein Ticket längere Zeit ohne Antwort bleibt, wird in diesem Abstand eine Erinnerung gesendet.',
    unit: 'Minuten',
    min: 0,
    max: 10080,
    group: 'notifications',
  },
  ping_throttle_minutes: {
    label: 'Erinnerungs-Ping-Abstand',
    description:
      'Mindestabstand zwischen zwei Erinnerungs-Pings, um übermäßige Benachrichtigungen zu vermeiden.',
    unit: 'Minuten',
    min: 0,
    max: 10080,
    group: 'notifications',
  },
};

interface GroupDef {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const GROUPS: GroupDef[] = [
  {
    id: 'lifecycle',
    title: 'Ticket-Lebensdauer',
    description: 'Steuere, wann Tickets automatisch geschlossen werden und wie lange sie wieder geöffnet werden können.',
    icon: <Clock className="h-5 w-5 text-astra-accent" />,
  },
  {
    id: 'notifications',
    title: 'Erinnerungen & Benachrichtigungen',
    description: 'Lege fest, in welchen Abständen Erinnerungen an unbeantwortete Tickets gesendet werden.',
    icon: <Bell className="h-5 w-5 text-astra-accent" />,
  },
];

/* ── Hilfsfunktion: Metadaten für ein Feld ──────────────────────── */

function getMeta(key: string): FieldMeta {
  return (
    FIELD_META[key] ?? {
      label: key,
      description: '',
      group: '_other',
    }
  );
}

/* ── Komponente ─────────────────────────────────────────────────── */

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
    setInfo(null);
  };

  /* Felder nach Gruppen aufteilen */
  const fieldsByGroup: Record<string, [string, unknown][]> = {};
  for (const [key, value] of Object.entries(config)) {
    const group = getMeta(key).group;
    if (!fieldsByGroup[group]) fieldsByGroup[group] = [];
    fieldsByGroup[group].push([key, value]);
  }

  /* Sortierte Gruppen: definierte zuerst, dann Rest */
  const orderedGroupIds = GROUPS.map(g => g.id);
  const extraGroups = Object.keys(fieldsByGroup).filter(g => !orderedGroupIds.includes(g));
  const allGroupIds = [...orderedGroupIds.filter(g => fieldsByGroup[g]), ...extraGroups];

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
      {info && !dirty && (
        <SettingsCard>
          <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-[0.95rem] text-emerald-200">{info}</div>
        </SettingsCard>
      )}

      {!loading && !error && (
        <>
          {Object.keys(config).length === 0 ? (
            <SettingsCard>
              <div className="flex items-start gap-3 rounded-lg border border-[#2a2d4a] bg-[#13152a]/60 p-4">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#8b8fad]" />
                <p className="text-[0.9rem] leading-relaxed text-[#8b8fad]">
                  Keine Konfigurationsfelder verfügbar. Die Konfiguration wird von der Astra-API bereitgestellt.
                </p>
              </div>
            </SettingsCard>
          ) : (
            allGroupIds.map(groupId => {
              const groupDef = GROUPS.find(g => g.id === groupId);
              const fields = fieldsByGroup[groupId] ?? [];
              if (fields.length === 0) return null;

              return (
                <SettingsCard
                  key={groupId}
                  header={
                    <div className="flex items-center gap-2">
                      {groupDef?.icon ?? <Info className="h-5 w-5 text-astra-accent" />}
                      <span className="text-[#dbe3ff] font-medium">
                        {groupDef?.title ?? 'Weitere Einstellungen'}
                      </span>
                    </div>
                  }
                >
                  {groupDef?.description && (
                    <p className="mb-4 text-[0.85rem] leading-relaxed text-[#8b8fad]">
                      {groupDef.description}
                    </p>
                  )}

                  <div className="space-y-5">
                    {fields.map(([key, value]) => {
                      const meta = getMeta(key);
                      return (
                        <div
                          key={key}
                          className="rounded-lg border border-[#2a2d4a]/60 bg-[#13152a]/40 p-4 space-y-2"
                        >
                          <label className="block text-[0.9rem] font-medium text-[#dbe3ff]">
                            {meta.label}
                          </label>
                          {meta.description && (
                            <p className="text-[0.8rem] leading-relaxed text-[#8b8fad]">
                              {meta.description}
                            </p>
                          )}

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
                          ) : typeof value === 'number' && (meta.unit === 'Stunden' || meta.unit === 'Minuten') ? (
                            <DurationPicker
                              value={value}
                              unit={meta.unit === 'Stunden' ? 'hours' : 'minutes'}
                              onChange={(v) => updateField(key, v)}
                              min={meta.min}
                              max={meta.max}
                              className="max-w-[280px]"
                            />
                          ) : typeof value === 'number' ? (
                            <div className="flex items-center gap-3">
                              <StyledInput
                                type="number"
                                value={String(value)}
                                onChange={e => {
                                  const num = Number(e.target.value);
                                  if (meta.min !== undefined && num < meta.min) return;
                                  if (meta.max !== undefined && num > meta.max) return;
                                  updateField(key, num);
                                }}
                                min={meta.min}
                                max={meta.max}
                                className="max-w-[160px]"
                              />
                              {meta.unit && (
                                <span className="text-[0.8rem] text-[#8b8fad] whitespace-nowrap">
                                  {meta.unit}
                                </span>
                              )}
                            </div>
                          ) : (
                            <StyledInput
                              value={String(value ?? '')}
                              onChange={e => updateField(key, e.target.value)}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </SettingsCard>
              );
            })
          )}

          <SettingsSaveBar
            dirty={dirty}
            saving={saving}
            onSave={onSave}
            onCancel={() => { setConfig(original); setInfo(null); }}
          />
        </>
      )}
    </div>
  );
};

export default TicketConfigPage;
