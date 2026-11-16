import React from 'react';

const ServerLogsPlaceholder: React.FC = () => {
  return (
    <div className="space-y-4">
      <h1 className="text-[1.4rem] font-bold">Logs</h1>
      <p className="text-[#b8bed6]">Spätere Anzeige von Ereignis- und Moderations-Logs. Platzhalteransicht.</p>
      <div className="rounded-[1.05rem] border border-[#2e334a] bg-[linear-gradient(180deg,#151828_0%,#121524_100%)] p-6">
        <div className="h-36 rounded-lg border border-[#2a2f45] bg-[#161a30]" />
      </div>
    </div>
  );
};

export default ServerLogsPlaceholder;
