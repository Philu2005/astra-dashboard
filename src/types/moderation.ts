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
  // Ab sofort als Liste von Regeln. Für Rückwärtskompatibilität kann das Frontend
  // weiterhin ein einzelnes Objekt in eine 1‑Element‑Liste umwandeln.
  rules?: AutomodRules;
  capslock?: AutomodCapslock;
  // Optionaler Profanity‑Block: Aktivierung des Beleidigungsfilters (wird in der Bot‑API über
  // blacklist_settings.status aktiviert/deaktiviert). Weitere interne Details werden NICHT
  // im Dashboard konfiguriert.
  profanity?: {
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
