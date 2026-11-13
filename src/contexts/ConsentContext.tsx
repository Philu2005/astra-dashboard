import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ConsentDecision, ConsentPreferences } from '@/types/consent';

const CONSENT_STORAGE_KEY = 'astra_consent';
const CONSENT_VERSION = '2026-11-13';

const defaultPreferences: ConsentPreferences = {
  necessary: true,
  analytics: false,
};

type ConsentContextType = {
  decision: ConsentDecision | null;
  preferences: ConsentPreferences;
  hasConsent: boolean;
  bannerOpen: boolean;
  settingsOpen: boolean;
  acceptAll: () => void;
  acceptNecessaryOnly: () => void;
  savePreferences: (analytics: boolean) => void;
  openSettings: () => void;
  closeSettings: () => void;
  reopenBanner: () => void;
  revokeOptionalConsent: () => void;
};

const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

export const ConsentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [decision, setDecision] = useState<ConsentDecision | null>(null);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
      if (!raw) {
        setBannerOpen(true);
        return;
      }

      const parsed = JSON.parse(raw) as ConsentDecision;
      if (parsed.version !== CONSENT_VERSION) {
        setBannerOpen(true);
        return;
      }

      setDecision(parsed);
    } catch {
      setBannerOpen(true);
    }
  }, []);

  const persist = useCallback((preferences: ConsentPreferences) => {
    const nextDecision: ConsentDecision = {
      version: CONSENT_VERSION,
      updatedAt: new Date().toISOString(),
      preferences,
    };

    setDecision(nextDecision);
    setBannerOpen(false);
    setSettingsOpen(false);
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(nextDecision));
  }, []);

  const acceptAll = useCallback(() => {
    persist({ necessary: true, analytics: true });
  }, [persist]);

  const acceptNecessaryOnly = useCallback(() => {
    persist({ necessary: true, analytics: false });
  }, [persist]);

  const savePreferences = useCallback(
    (analytics: boolean) => {
      persist({ necessary: true, analytics });
    },
    [persist],
  );

  const openSettings = useCallback(() => {
    setSettingsOpen(true);
  }, []);

  const closeSettings = useCallback(() => {
    setSettingsOpen(false);
  }, []);

  const reopenBanner = useCallback(() => {
    setBannerOpen(true);
  }, []);

  const revokeOptionalConsent = useCallback(() => {
    persist({ necessary: true, analytics: false });
  }, [persist]);

  const preferences = decision?.preferences ?? defaultPreferences;
  const hasConsent = Boolean(decision);

  const value = useMemo<ConsentContextType>(
    () => ({
      decision,
      preferences,
      hasConsent,
      bannerOpen,
      settingsOpen,
      acceptAll,
      acceptNecessaryOnly,
      savePreferences,
      openSettings,
      closeSettings,
      reopenBanner,
      revokeOptionalConsent,
    }),
    [
      decision,
      preferences,
      hasConsent,
      bannerOpen,
      settingsOpen,
      acceptAll,
      acceptNecessaryOnly,
      savePreferences,
      openSettings,
      closeSettings,
      reopenBanner,
      revokeOptionalConsent,
    ],
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
};

export const useConsent = () => {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error('useConsent must be used within a ConsentProvider');
  }

  return context;
};
