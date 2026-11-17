import React from 'react';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import SettingsCard from '@/components/settings/SettingsCard';
import { BarChart3, TrendingUp } from 'lucide-react';

const ServerStatsPlaceholder: React.FC = () => {
  return (
    <div className="space-y-5">
      <SettingsPageHeader
        heading="Statistiken"
        description="Hier folgen später serverweite Statistiken und Diagramme. Platzhalter für Phase 2."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SettingsCard header={
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#7de3ff]" />
            <span className="text-[#dbe3ff] font-medium">Nutzungsstatistik</span>
          </div>
        }>
          <div className="h-40 rounded-lg border border-dashed border-[#2a2f45] bg-[#0f1220]/60 flex items-center justify-center">
            <p className="text-[0.95rem] text-[#6b7194]">Demnächst verfügbar</p>
          </div>
        </SettingsCard>
        <SettingsCard header={
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#7de3ff]" />
            <span className="text-[#dbe3ff] font-medium">Aktivitätsverlauf</span>
          </div>
        }>
          <div className="h-40 rounded-lg border border-dashed border-[#2a2f45] bg-[#0f1220]/60 flex items-center justify-center">
            <p className="text-[0.95rem] text-[#6b7194]">Demnächst verfügbar</p>
          </div>
        </SettingsCard>
      </div>
    </div>
  );
};
export default ServerStatsPlaceholder;
