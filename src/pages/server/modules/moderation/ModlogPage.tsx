import React from 'react';

const ModlogPage: React.FC = () => {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium text-white">Modlog</h2>
      <p className="text-sm text-foreground/70">
        Konfiguration des Moderationsprotokolls, inklusive Zielkanal und Protokollierungsoptionen.
      </p>
      <div className="mt-4 rounded-lg border border-layout-divider bg-black/20 p-4 text-sm text-foreground/70">
        Die konkrete Konfiguration wird in Phase 5 umgesetzt. Momentan dient diese Ansicht als Platzhalter.
      </div>
    </div>
  );
};

export default ModlogPage;
