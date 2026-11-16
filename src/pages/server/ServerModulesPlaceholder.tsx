import React from 'react';

const ServerModulesPlaceholder: React.FC = () => {
  return (
    <div className="space-y-4">
      <h1 className="text-[1.4rem] font-bold">Module</h1>
      <p className="text-[#b8bed6]">
        Die Modulübersicht wird in Phase 3 umgesetzt. Diese Seite ist ein visueller Platzhalter.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-[1.05rem] border border-[#2e334a] bg-[linear-gradient(180deg,#151828_0%,#121524_100%)]" />
        ))}
      </div>
    </div>
  );
};

export default ServerModulesPlaceholder;
