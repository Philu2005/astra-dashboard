export type ConsentCategory = 'necessary' | 'analytics';

export interface ConsentPreferences {
  necessary: true;
  analytics: boolean;
}

export interface ConsentDecision {
  version: string;
  updatedAt: string;
  preferences: ConsentPreferences;
}
