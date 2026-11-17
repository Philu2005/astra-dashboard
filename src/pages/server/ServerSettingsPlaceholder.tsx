import React, { useMemo, useState } from 'react';
import SettingsCard from '@/components/ui/SettingsCard';
import SettingsSection from '@/components/ui/SettingsSection';
import CustomCheckbox from '@/components/ui/CustomCheckbox';
import CustomSwitch from '@/components/ui/CustomSwitch';
import StyledInput from '@/components/ui/StyledInput';
import StyledNumberInput from '@/components/ui/StyledNumberInput';
import StyledTextarea from '@/components/ui/StyledTextarea';
import AstraSelect from '@/components/ui/AstraSelect';

const ServerSettingsPlaceholder: React.FC = () => {
  // Beispielzustände (später via API verbinden)
  const [values, setValues] = useState({
    maintenance: false,
    analytics: true,
    orgName: 'Astra GmbH',
    requestLimit: 120,
    region: 'eu-central-1',
    notes: '',
  });
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const onField = <K extends keyof typeof values>(key: K, v: (typeof values)[K]) => {
    setValues((s) => ({ ...s, [key]: v }));
    setDirty(true);
  };

  const canSave = useMemo(() => dirty && !saving, [dirty, saving]);

  const save = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setSaving(false);
    setDirty(false);
    setSavedAt(Date.now());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[1.45rem] font-semibold tracking-[-0.01em] text-white">Einstellungen</h1>
        <button
          type="button"
          onClick={save}
          disabled={!canSave}
          className={
            'inline-flex h-10 items-center gap-2 rounded-md px-4 text-[0.95rem] transition-colors ' +
            (canSave
              ? 'bg-astra-purple/90 text-white hover:bg-astra-purple'
              : 'bg-[#20243a] text-[#9aa3c4] cursor-not-allowed')
          }
        >
          {saving ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
                <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" />
              </svg>
              Speichern…
            </>
          ) : dirty ? (
            'Änderungen speichern'
          ) : savedAt ? (
            'Gespeichert'
          ) : (
            'Speichern'
          )}
        </button>
      </div>

      <SettingsCard
        title="Allgemein"
        description="Grundlegende Einstellungen und Betriebsmodi."
      >
        <SettingsSection title="Betrieb" description="Verwaltung des Betriebszustands" columns={2}>
          <CustomSwitch
            checked={values.maintenance}
            onChange={(e) => onField('maintenance', e.currentTarget.checked)}
            label="Wartungsmodus"
            description="Bei Aktivierung ist das System nur für Admins verfügbar."
          />
          <CustomCheckbox
            checked={values.analytics}
            onChange={(e) => onField('analytics', e.currentTarget.checked)}
            label="Anonymisierte Nutzungsanalyse"
            description="Hilft uns, die Qualität zu verbessern."
          />
        </SettingsSection>

        <SettingsSection title="Organisation" description="Name und Region" columns={2}>
          <div>
            <label className="mb-1 block text-[0.86rem] text-[#aab3d2]">Organisationsname</label>
            <StyledInput
              value={values.orgName}
              onChange={(e) => onField('orgName', e.currentTarget.value)}
              placeholder="Organisation"
            />
          </div>
          <div>
            <label className="mb-1 block text-[0.86rem] text-[#aab3d2]">Region</label>
            <AstraSelect value={values.region} onChange={(e) => onField('region', e.currentTarget.value)}>
              <option value="eu-central-1">eu-central-1 (Frankfurt)</option>
              <option value="eu-west-1">eu-west-1 (Irland)</option>
              <option value="us-east-1">us-east-1 (N. Virginia)</option>
            </AstraSelect>
          </div>
        </SettingsSection>

        <SettingsSection title="Limits" description="Begrenzung von Anfragen" columns={2}>
          <div>
            <label className="mb-1 block text-[0.86rem] text-[#aab3d2]">Requests / Minute</label>
            <StyledNumberInput
              value={values.requestLimit}
              min={0}
              max={10000}
              step={10}
              onChange={(e) => onField('requestLimit', Number(e.currentTarget.value || 0))}
              hint="Grenze für API-Anfragen"
            />
          </div>
        </SettingsSection>

        <SettingsSection title="Hinweise" columns={1}>
          <div>
            <label className="mb-1 block text-[0.86rem] text-[#aab3d2]">Administrative Notizen</label>
            <StyledTextarea
              value={values.notes}
              onChange={(e) => onField('notes', e.currentTarget.value)}
              placeholder="Interne Hinweise zur Konfiguration"
              resizable={false}
            />
          </div>
        </SettingsSection>
      </SettingsCard>
    </div>
  );
};

export default ServerSettingsPlaceholder;
