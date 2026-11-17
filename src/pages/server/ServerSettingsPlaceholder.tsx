import React, { useMemo, useState } from 'react';
import SettingsCard from '@/components/settings/SettingsCard';
import SettingsSection from '@/components/settings/SettingsSection';
import { StyledCheckbox } from '@/components/ui/StyledCheckbox';
import { StyledSwitch } from '@/components/ui/StyledSwitch';
import { StyledInput } from '@/components/ui/StyledInput';
import { StyledNumberInput } from '@/components/ui/StyledNumberInput';
import { StyledTextarea } from '@/components/ui/StyledTextarea';
import { StyledSelect } from '@/components/ui/StyledSelect';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import { StyledButton } from '@/components/ui/StyledButton';

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
    <div className="space-y-5">
      <SettingsPageHeader heading="Einstellungen" description="Grundlegende Servereinstellungen (Platzhalter)." actions={
        <StyledButton variant={canSave ? 'primary' : 'secondary'} disabled={!canSave} onClick={save}>
          {saving ? 'Speichern…' : dirty ? 'Änderungen speichern' : savedAt ? 'Gespeichert' : 'Speichern'}
        </StyledButton>
      } />

      <SettingsCard header={<span className="text-[#dbe3ff]">Allgemein</span>}>
        <SettingsSection heading="Betrieb" description="Verwaltung des Betriebszustands">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <StyledSwitch
              checked={values.maintenance}
              onChange={(v) => onField('maintenance', v)}
              label="Wartungsmodus"
              hint="Bei Aktivierung ist das System nur für Admins verfügbar."
            />
            <StyledCheckbox
              checked={values.analytics}
              onChange={(e) => onField('analytics', e.currentTarget.checked)}
              label="Anonymisierte Nutzungsanalyse"
              hint="Hilft uns, die Qualität zu verbessern."
            />
          </div>
        </SettingsSection>

        <div className="h-4" />
        <SettingsSection heading="Organisation" description="Name und Region">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <div className="mb-1 text-[0.9rem] text-[#9ca2be]">Organisationsname</div>
              <StyledInput value={values.orgName} onChange={(e) => onField('orgName', e.currentTarget.value)} placeholder="Organisation" />
            </div>
            <div>
              <div className="mb-1 text-[0.9rem] text-[#9ca2be]">Region</div>
              <StyledSelect
                value={values.region}
                onChange={(v) => onField('region', v)}
                options={[
                  { value: 'eu-central-1', label: 'eu-central-1 (Frankfurt)' },
                  { value: 'eu-west-1', label: 'eu-west-1 (Irland)' },
                  { value: 'us-east-1', label: 'us-east-1 (N. Virginia)' },
                ]}
              />
            </div>
          </div>
        </SettingsSection>

        <div className="h-4" />
        <SettingsSection heading="Limits" description="Begrenzung von Anfragen">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <div className="mb-1 text-[0.9rem] text-[#9ca2be]">Requests / Minute</div>
              <StyledNumberInput
                value={values.requestLimit}
                min={0}
                max={10000}
                step={10}
                onChange={(e) => onField('requestLimit', Number(e.currentTarget.value || 0))}
                hint="Grenze für API-Anfragen"
              />
            </div>
          </div>
        </SettingsSection>

        <div className="h-4" />
        <SettingsSection heading="Hinweise">
          <div>
            <div className="mb-1 text-[0.9rem] text-[#9ca2be]">Administrative Notizen</div>
            <StyledTextarea value={values.notes} onChange={(e) => onField('notes', e.currentTarget.value)} placeholder="Interne Hinweise zur Konfiguration" />
          </div>
        </SettingsSection>
      </SettingsCard>
    </div>
  );
};

export default ServerSettingsPlaceholder;
