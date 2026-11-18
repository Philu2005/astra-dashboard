import React from 'react';
import {
  ModulePageLayout,
  ModulePageHeader,
  ModuleSection,
  ModuleSettingsCard,
  ModuleSettingsRow,
  ModuleActionButton,
  ModuleSelect,
  ModuleToggle,
  ModuleNumberInput,
  ModuleTextInput,
  ModuleTextarea,
  ModuleCheckbox,
  ModuleEmptyState,
  ModuleLoadingState,
  ModuleErrorState,
  ModuleChannelSelect,
} from '@/components/module-ui';

// Lokale Demo-Daten für den Channel-Select (keine API-Aufrufe, keine Mock-Endpunkte)
const demoCategories = [
  { id: 'cat-info', name: 'INFORMATION' },
  { id: 'cat-community', name: 'COMMUNITY' },
];

const demoChannels = [
  { id: '1', name: 'welcome', type: 0, parent_id: 'cat-info' },
  { id: '2', name: 'rules', type: 0, parent_id: 'cat-info' },
  { id: '3', name: 'news', type: 0, parent_id: 'cat-info' },
  { id: '4', name: 'general', type: 0, parent_id: 'cat-community' },
  { id: '5', name: 'media', type: 0, parent_id: 'cat-community' },
  { id: '6', name: 'voice-chat', type: 2, parent_id: 'cat-community' },
  { id: '7', name: 'no-category-text', type: 0, parent_id: null as any },
];

const withParentName = demoChannels.map((c) => ({
  ...c,
  parent_name: c.parent_id ? demoCategories.find((x) => x.id === c.parent_id)?.name : 'UNGROUPED',
}));

const SectionTitle: React.FC<{ title: string }>=({ title })=> (
  <h2 className="text-white/90 text-lg font-semibold mt-2">{title}</h2>
);

const CardGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
);

const RowLabel: React.FC<{ title: string; desc?: string }> = ({ title, desc }) => (
  <div className="space-y-0.5">
    <div className="text-white text-[0.95rem] font-medium">{title}</div>
    {desc && <div className="text-[#9ca2be] text-[0.85rem]">{desc}</div>}
  </div>
);

const ModuleUiPreview: React.FC = () => {
  const [toggleOn, setToggleOn] = React.useState(false);
  const [selectedChannel, setSelectedChannel] = React.useState<string | undefined>();
  const [selectValue, setSelectValue] = React.useState<string | undefined>();
  const [text, setText] = React.useState('');
  const [num, setNum] = React.useState<number | undefined>(5);
  const [multiline, setMultiline] = React.useState('Lorem ipsum dolor sit amet...');
  const [checked, setChecked] = React.useState(true);

  return (
    <ModulePageLayout className="py-6" twoColumns>
      <div className="lg:col-span-2">
        <ModulePageHeader
          heading="Module UI – Komponenten-Vorschau"
          description="Interaktive Vorschau der neuen Modul-Bausteine. Nur für Entwicklung – keine produktive Route."
        />
      </div>

      <div className="lg:col-span-2">
        <SectionTitle title="Cards, Sections & Rows" />
        <CardGrid>
          <ModuleSettingsCard>
            <div className="space-y-4">
              <ModuleSection heading="Formularelemente" description="Grundlegende Controls und Zeilenaufbau">
                <ModuleSettingsRow>
                  <RowLabel title="Einfacher Toggle" desc="Alias von StyledSwitch, Astra-Stil." />
                  <ModuleToggle checked={toggleOn} onChange={(v)=> setToggleOn(Boolean(v))} />
                </ModuleSettingsRow>
                <ModuleSettingsRow>
                  <RowLabel title="Select" desc="Auf StyledSelect basierend." />
                  <ModuleSelect
                    placeholder="Wähle etwas aus"
                    value={selectValue ?? null}
                    onChange={(v)=> setSelectValue(v)}
                    options={[
                      { value: 'a', label: 'Option A' },
                      { value: 'b', label: 'Option B' },
                      { value: 'c', label: 'Option C' },
                    ]}
                  />
                </ModuleSettingsRow>
                <ModuleSettingsRow>
                  <RowLabel title="Text Input" desc="Einzeiliges Feld mit Hint/Fehlerzustand." />
                  <div className="w-full max-w-md">
                    <ModuleTextInput
                      placeholder="Titel des Moduls"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      hint="Nur alphanumerische Zeichen"
                    />
                  </div>
                </ModuleSettingsRow>
                <ModuleSettingsRow>
                  <RowLabel title="Number Input" desc="Basierend auf StyledNumberInput." />
                  <ModuleNumberInput value={num as any} onChange={(v:any)=> setNum(v)} min={0} max={20} />
                </ModuleSettingsRow>
                <ModuleSettingsRow>
                  <RowLabel title="Textarea" desc="Mehrzeiliges Feld." />
                  <div className="w-full max-w-xl">
                    <ModuleTextarea value={multiline} onChange={(e)=> setMultiline(e.target.value)} />
                  </div>
                </ModuleSettingsRow>
                <ModuleSettingsRow>
                  <RowLabel title="Checkbox" desc="Einfacher Haken." />
                  <ModuleCheckbox checked={checked} onChange={(e)=> setChecked(e.target.checked)}>Benachrichtigungen aktivieren</ModuleCheckbox>
                </ModuleSettingsRow>
              </ModuleSection>
            </div>
          </ModuleSettingsCard>

          <ModuleSettingsCard>
            <div className="space-y-4">
              <ModuleSection heading="Buttons & Toggles" description="Zustände und Varianten">
                <ModuleSettingsRow>
                  <RowLabel title="Buttons" desc="Action-Buttons (Primary, Secondary, Danger, Ghost)." />
                  <div className="flex flex-wrap gap-2">
                    <ModuleActionButton variant="primary">Primary</ModuleActionButton>
                    <ModuleActionButton variant="secondary">Secondary</ModuleActionButton>
                    <ModuleActionButton variant="danger">Danger</ModuleActionButton>
                    <ModuleActionButton variant="ghost">Ghost</ModuleActionButton>
                  </div>
                </ModuleSettingsRow>
                <ModuleSettingsRow>
                  <RowLabel title="Toggle Zustände" desc="OFF und ON Darstellung" />
                  <div className="flex items-center gap-4">
                    <ModuleToggle checked={false} onChange={()=>{}} />
                    <ModuleToggle checked={true} onChange={()=>{}} />
                  </div>
                </ModuleSettingsRow>
              </ModuleSection>
            </div>
          </ModuleSettingsCard>
        </CardGrid>
      </div>

      <div className="lg:col-span-2">
        <SectionTitle title="States (Empty, Loading, Error)" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <ModuleEmptyState title="Keine Einträge" description="Füge eine erste Regel oder Konfiguration hinzu." />
          <ModuleLoadingState lines={5} />
          <ModuleErrorState message="Fehler beim Laden der Daten." />
        </div>
      </div>

      <div className="lg:col-span-2">
        <SectionTitle title="Discord-artiger Channel-Select" />
        <ModuleSettingsCard>
          <ModuleSection heading="Gruppierte Auswahl" description="Kategorien mit Channels">
            <ModuleSettingsRow>
              <RowLabel title="Channel" desc="Gruppiert nach Kategorien; Text/Voice sichtbar." />
              <div className="w-full max-w-md">
                <ModuleChannelSelect
                  items={withParentName}
                  value={selectedChannel ?? null}
                  onChange={(v:string)=> setSelectedChannel(v)}
                  placeholder="# wähle einen Channel"
                  groupByCategory
                />
              </div>
            </ModuleSettingsRow>
          </ModuleSection>
        </ModuleSettingsCard>
      </div>
    </ModulePageLayout>
  );
};

export default ModuleUiPreview;
