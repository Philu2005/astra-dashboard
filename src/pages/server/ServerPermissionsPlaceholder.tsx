import React from 'react';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import SettingsCard from '@/components/settings/SettingsCard';
import { ShieldCheck, Users, Lock } from 'lucide-react';

const ServerPermissionsPlaceholder: React.FC = () => {
  return (
    <div className="space-y-5">
      <SettingsPageHeader
        heading="Berechtigungen"
        description="Hier werden später Berechtigungen für Astra-Funktionen pro Server verwaltet. Platzhalter für Phase 2."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: ShieldCheck, label: 'Rollen', value: '—' },
          { icon: Users, label: 'Benutzer', value: '—' },
          { icon: Lock, label: 'Einschränkungen', value: '—' },
        ].map((item) => (
          <SettingsCard key={item.label}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1d2238] text-[#9b95ff] border border-[#353c56] shrink-0">
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[0.82rem] text-[#8d92a8]">{item.label}</p>
                <p className="text-[1.1rem] font-semibold text-white">{item.value}</p>
              </div>
            </div>
          </SettingsCard>
        ))}
      </div>

      <SettingsCard header={<span className="text-[#dbe3ff] font-medium">Berechtigungsverwaltung</span>}>
        <div className="h-28 rounded-lg border border-dashed border-[#2a2f45] bg-[#0f1220]/60 flex items-center justify-center">
          <p className="text-[0.95rem] text-[#6b7194]">Wird in Phase 2 implementiert</p>
        </div>
      </SettingsCard>
    </div>
  );
};
export default ServerPermissionsPlaceholder;
