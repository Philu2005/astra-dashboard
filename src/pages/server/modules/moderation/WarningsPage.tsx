import React from 'react';

const WarningsPage: React.FC = () => {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium text-white">Verwarnungen</h2>
      <p className="text-sm text-foreground/70">
        Übersicht und Verwaltung der Verwarnungen für Servermitglieder. In Phase 5 kannst du hier Einträge
        einsehen, filtern und bei Bedarf entfernen.
      </p>
      <div className="mt-4 rounded-lg border border-layout-divider bg-black/20 p-4 text-sm text-foreground/70">
        Funktionalität folgt in Phase 5. Derzeit kein Backend-Zugriff und keine Live-Daten.
      </div>
    </div>
  );
};

export default WarningsPage;
