import React from 'react';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import SettingsCard from '@/components/settings/SettingsCard';
import { History, FileText } from 'lucide-react';

const ServerLogsPlaceholder: React.FC = () => {
  return (
    <div className="space-y-5">
      <SettingsPageHeader
        heading="Logs"
        description="Spätere Anzeige von Ereignis- und Moderations-Logs. Platzhalteransicht."
      />

      <SettingsCard header={
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-[#7de3ff]" />
          <span className="text-[#dbe3ff] font-medium">Ereignisprotokoll</span>
        </div>
      }>
        <div className="h-36 rounded-lg border border-dashed border-[#2a2f45] bg-[#0f1220]/60 flex flex-col items-center justify-center gap-2">
          <FileText className="w-8 h-8 text-[#6b7194]" />
          <p className="text-[0.95rem] text-[#6b7194]">Wird in Phase 2 implementiert</p>
        </div>
      </SettingsCard>
    </div>
  );
};
export default ServerLogsPlaceholder;
