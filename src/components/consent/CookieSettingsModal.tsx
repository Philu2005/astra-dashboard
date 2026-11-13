import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useConsent } from '@/contexts/ConsentContext';

export const CookieSettingsModal = () => {
  const { settingsOpen, closeSettings, savePreferences, preferences, revokeOptionalConsent } = useConsent();
  const [analyticsEnabled, setAnalyticsEnabled] = useState(preferences.analytics);

  useEffect(() => {
    setAnalyticsEnabled(preferences.analytics);
  }, [preferences.analytics, settingsOpen]);

  if (!settingsOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#050710]/72 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-[#3a4061] bg-[linear-gradient(180deg,#15192b_0%,#101423_100%)] shadow-[0_30px_80px_-46px_rgba(75,70,200,0.95)]">
        <div className="flex items-start justify-between gap-4 border-b border-layout-divider px-5 py-4 sm:px-6">
          <div>
            <h3 className="text-xl font-semibold text-white">Cookie-Einstellungen</h3>
            <p className="mt-1 text-sm text-[#b7c0de]">Verwalte hier, welche optionalen Cookies verwendet werden dürfen.</p>
          </div>
          <button
            type="button"
            onClick={closeSettings}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#2f3653] bg-[#11162a] text-[#b9c4e2] transition-colors hover:border-[#57609c] hover:text-white"
            aria-label="Cookie-Einstellungen schließen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5 sm:px-6">
          <div className="rounded-xl border border-[#313958] bg-[#13192b] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Technisch notwendige Cookies</p>
                <p className="mt-1 text-xs text-[#a8b3d4]">Erforderlich für Login, Session-Sicherheit und den stabilen Betrieb.</p>
              </div>
              <span className="rounded-full border border-[#4f61a8] bg-[#1c2540] px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-[#96d8ff]">Immer aktiv</span>
            </div>
          </div>

          <div className="rounded-xl border border-[#313958] bg-[#13192b] p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white">Optionale Analyse-Cookies</p>
                <p className="mt-1 text-xs text-[#a8b3d4]">Derzeit sind keine aktiven Analyse-Dienste integriert. Diese Kategorie bleibt standardmäßig deaktiviert.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={analyticsEnabled}
                onClick={() => setAnalyticsEnabled((prev) => !prev)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-colors ${analyticsEnabled ? 'border-[#7a6dff] bg-[#4b46c8]' : 'border-[#3c4567] bg-[#1a2238]'}`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${analyticsEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-between gap-3 border-t border-layout-divider px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={revokeOptionalConsent}
            className="inline-flex items-center justify-center rounded-xl border border-[#425081] bg-[#131b31] px-4 py-2 text-sm font-semibold text-[#c7d2f1] transition-colors hover:border-[#6a79b8] hover:text-white"
          >
            Optionale widerrufen
          </button>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={closeSettings}
              className="inline-flex items-center justify-center rounded-xl border border-layout-divider bg-layout-hover px-4 py-2 text-sm font-semibold text-[#d5dcf2] transition-colors hover:border-[#5f68a2] hover:text-white"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={() => savePreferences(analyticsEnabled)}
              className="inline-flex items-center justify-center rounded-xl border border-[#6d67eb] bg-[linear-gradient(138deg,#6662e8_0%,#4b46c8_52%,#9d49f4_100%)] px-4 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:border-[#9690ff]"
            >
              Auswahl speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
