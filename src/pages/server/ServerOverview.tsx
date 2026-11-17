import React from 'react';
import { useServerContext } from '@/contexts/ServerContext';
import { Users, ShieldCheck, Activity } from 'lucide-react';

const InfoCard: React.FC<{ title: string; value: React.ReactNode; icon: React.ElementType }> = ({ title, value, icon: Icon }) => (
  <div className="bg-[linear-gradient(180deg,#151828_0%,#121524_100%)] border border-[#2e334a] rounded-[1.05rem] p-4 sm:p-5 shadow-astra">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#161a30] border border-[#2a2f45] flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#c6cbdf]" />
      </div>
      <div className="min-w-0">
        <p className="text-[0.78rem] sm:text-[0.82rem] text-[#8d92a8]">{title}</p>
        <p className="text-[1.05rem] sm:text-[1.2rem] font-semibold text-white truncate">{value}</p>
      </div>
    </div>
  </div>
);

export const ServerOverview: React.FC = () => {
  const { selectedServer } = useServerContext();
  if (!selectedServer) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          {selectedServer.icon ? (
            <img src={selectedServer.icon} alt={selectedServer.name} className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl object-cover border border-white/10 shadow-astra-glow shrink-0" />
          ) : (
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-astra-purple text-white font-bold flex items-center justify-center border border-white/10 shadow-astra-glow shrink-0 text-sm sm:text-base">
              {selectedServer.initials}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-[1.2rem] sm:text-[1.6rem] font-bold tracking-[-0.01em] truncate">{selectedServer.name}</h1>
            <p className="text-[#8d92a8] text-[0.82rem] sm:text-[0.92rem]">Verwaltung und Einstellungen</p>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <InfoCard title="Mitglieder" value={selectedServer.memberCount.toLocaleString('de-DE')} icon={Users} />
        <InfoCard title="Astra-Status" value={<span className="text-emerald-300">Aktiv</span>} icon={Activity} />
        <InfoCard title="Rolle" value={selectedServer.owner ? 'Serverbesitzer' : 'Administrator/Moderator'} icon={ShieldCheck} />
      </div>

      <div className="bg-[linear-gradient(180deg,#151828_0%,#121524_100%)] border border-[#2e334a] rounded-[1.05rem] p-4 sm:p-6">
        <h2 className="text-[1rem] sm:text-[1.12rem] font-semibold mb-2">Willkommen in der Serververwaltung</h2>
        <p className="text-[#b8bed6] text-[0.88rem] sm:text-[0.98rem] leading-relaxed">
          Hier findest du serverweite Einstellungen, Module und administrative Bereiche wie Berechtigungen, Logs und Statistiken.
          Nutze die Navigation auf der linken Seite, um Bereiche zu öffnen. Diese Seite dient als Übersicht und Einstieg.
        </p>
      </div>
    </div>
  );
};

export default ServerOverview;
