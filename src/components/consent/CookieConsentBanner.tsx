import { useConsent } from '@/contexts/ConsentContext';

export const CookieConsentBanner = () => {
  const { bannerOpen, acceptAll, acceptNecessaryOnly, openSettings } = useConsent();

  if (!bannerOpen) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] px-4 pb-4 sm:px-6 sm:pb-6">
      <div className="mx-auto w-full max-w-5xl rounded-2xl border border-[#394064] bg-[linear-gradient(180deg,rgba(19,25,43,0.98)_0%,rgba(14,19,34,0.98)_100%)] p-4 shadow-[0_25px_65px_-36px_rgba(76,70,201,0.95)] backdrop-blur-md motion-reduce:transition-none animate-in fade-in slide-in-from-bottom-3 duration-300">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h3 className="text-lg font-semibold text-white">Deine Privatsphäre ist uns wichtig.</h3>
            <p className="mt-1 text-sm leading-relaxed text-[#b7c0de]">
              Astra verwendet technisch notwendige Cookies, um dir eine sichere Anmeldung und eine zuverlässige Nutzung des Dashboards zu ermöglichen. Weitere Cookies werden nur mit deiner Zustimmung verwendet.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={acceptNecessaryOnly}
              className="inline-flex items-center justify-center rounded-xl border border-layout-divider bg-layout-hover px-4 py-2 text-sm font-semibold text-[#d5dcf2] transition-colors hover:border-[#5f68a2] hover:text-white"
            >
              Nur notwendige Cookies
            </button>
            <button
              type="button"
              onClick={openSettings}
              className="inline-flex items-center justify-center rounded-xl border border-[#495585] bg-[#141b31] px-4 py-2 text-sm font-semibold text-[#d5dcf2] transition-colors hover:border-[#6b79b9] hover:text-white"
            >
              Einstellungen
            </button>
            <button
              type="button"
              onClick={acceptAll}
              className="inline-flex items-center justify-center rounded-xl border border-[#6d67eb] bg-[linear-gradient(138deg,#6662e8_0%,#4b46c8_52%,#9d49f4_100%)] px-4 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:border-[#9690ff]"
            >
              Alle akzeptieren
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
