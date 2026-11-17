// Eine einzelne AutoMod-Regel
export type AutomodRule = {
  warns: number; // Anzahl Verwarnungen, bei der die Aktion ausgelöst wird
  action: string; // z. B. "timeout" | "kick" | "ban" (Backend-Quelle maßgeblich)
  timeout_seconds?: number; // nur relevant bei action === "timeout"
};

// Liste von Regeln
export type AutomodRules = AutomodRule[];

export type AutomodCapslock = {
  percent?: number;
  enabled?: boolean;
};

export type AutomodConfig = {
  rules?: AutomodRules;
  capslock?: AutomodCapslock;
  // Beleidigungsfilter – entspricht dem Feld "blacklist" der internen Astra-API.
  // Nur enabled wird im Dashboard gesteuert. Keine Wortverwaltung.
  blacklist?: {
    enabled?: boolean;
  };
};

export type AutomodResponse = {
  success: boolean;
  config: AutomodConfig;
};

export type ModlogResponse = {
  success: boolean;
  channelId: string | null;
};

export type WarnItem = {
  userId: string;
  warnId: string;
  reason: string | null;
};

export type WarnsResponse = {
  success: boolean;
  count: number;
  warns: WarnItem[];
};
