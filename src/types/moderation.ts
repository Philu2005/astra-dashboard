export type AutomodRules = {
  warns?: number;
  action?: string;
  timeout_seconds?: number;
};

export type AutomodCapslock = {
  percent?: number;
  enabled?: boolean;
};

export type AutomodBlacklist = {
  enabled?: boolean;
  words?: string[];
};

export type AutomodConfig = {
  rules?: AutomodRules;
  capslock?: AutomodCapslock;
  blacklist?: AutomodBlacklist;
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
  warnId: string;
  reason: string | null;
};

export type WarnsResponse = {
  success: boolean;
  count: number;
  warns: WarnItem[];
};
