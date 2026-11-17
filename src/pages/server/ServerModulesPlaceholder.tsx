import React from 'react';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import SettingsCard from '@/components/settings/SettingsCard';
import { Blocks } from 'lucide-react';

const ServerModulesPlaceholder: React.FC = () => {
  return (
    <div className="space-y-5">
      <SettingsPageHeader
        heading="Module"
        description="Die Modulübersicht wird in Phase 3 umgesetzt. Diese Seite ist ein visueller Platzhalter."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SettingsCard key={i}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1d2238] text-[#9b95ff] border border-[#353c56] shrink-0">
                <Blocks className="w-5 h-5" />
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 rounded bg-[#1d2238]" />
                <div className="h-2.5 w-36 rounded bg-[#161a30]" />
              </div>
            </div>
          </SettingsCard>
        ))}
      </div>
    </div>
  );
};
export default ServerModulesPlaceholder;
