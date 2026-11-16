import React from 'react';

const ModerationPlaceholder: React.FC = () => {
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold text-white">Moderation</h1>
      <p className="text-sm text-foreground/70">
        Die Moderationskonfiguration (AutoMod, Verwarnungen, Modlog) wird in Phase 4 implementiert. Diese Seite ist
        ein vorbereiteter Zielort aus der Modulübersicht.
      </p>
    </div>
  );
};

export default ModerationPlaceholder;
