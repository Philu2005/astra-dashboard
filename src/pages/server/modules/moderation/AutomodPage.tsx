import React from 'react';

const AutomodPage: React.FC = () => {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium text-white">AutoMod</h2>
      <p className="text-sm text-foreground/70">
        Konfiguration der automatischen Moderationsfunktionen von Astra. Hier kannst du später Regeln und
        Filter festlegen, um unerwünschte Inhalte automatisch zu erkennen und zu handeln.
      </p>
      <div className="mt-4 rounded-lg border border-layout-divider bg-black/20 p-4 text-sm text-foreground/70">
        Diese Konfiguration wird in Phase 5 implementiert. Aktuell handelt es sich um einen Platzhalter ohne
        Backend-Aufrufe.
      </div>
    </div>
  );
};

export default AutomodPage;
