import React from 'react';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import SettingsCard from '@/components/settings/SettingsCard';
import { ShieldCheck } from 'lucide-react';

const ModerationPlaceholder: React.FC = () => {
  return (
    <div className="space-y-5">
      <SettingsPageHeader
        heading="Moderation"
        description="Die Moderationskonfiguration (AutoMod, Verwarnungen, Modlog) wird in Phase 4 implementiert. Diese Seite ist ein vorbereiteter Zielort aus der Modulübersicht."
      />

      <SettingsCard header={
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#7de3ff]" />
          <span className="text-[#dbe3ff] font-medium">Moderationsübersicht</span>
        </div>
      }>
        <div className="h-24 rounded-lg border border-dashed border-[#2a2f45] bg-[#0f1220]/60 flex items-center justify-center">
          <p className="text-[0.95rem] text-[#6b7194]">Nutze die Unternavigation, um AutoMod, Verwarnungen oder Modlog zu konfigurieren.</p>
        </div>
      </SettingsCard>
    </div>
  );
};
export default ModerationPlaceholder;
