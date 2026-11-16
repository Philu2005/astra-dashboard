import React from 'react';

const ServerStatsPlaceholder: React.FC = () => {
  return (
    <div className="space-y-4">
      <h1 className="text-[1.4rem] font-bold">Statistiken</h1>
      <p className="text-[#b8bed6]">Hier folgen später serverweite Statistiken und Diagramme. Platzhalter für Phase 2.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-40 rounded-[1.05rem] border border-[#2e334a] bg-[linear-gradient(180deg,#151828_0%,#121524_100%)]" />
        <div className="h-40 rounded-[1.05rem] border border-[#2e334a] bg-[linear-gradient(180deg,#151828_0%,#121524_100%)]" />
      </div>
    </div>
  );
};

export default ServerStatsPlaceholder;
