import { useConsent } from '@/contexts/ConsentContext';

type CookieSettingsTriggerProps = {
  className?: string;
};

export const CookieSettingsTrigger = ({ className }: CookieSettingsTriggerProps) => {
  const { openSettings } = useConsent();

  return (
    <button
      type="button"
      onClick={openSettings}
      className={className}
    >
      Cookie-Einstellungen
    </button>
  );
};
