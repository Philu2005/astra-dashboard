import React from 'react';
import SettingsPageHeader, { type SettingsPageHeaderProps } from '@/components/settings/SettingsPageHeader';

export type ModulePageHeaderProps = SettingsPageHeaderProps;

/**
 * Dünner Wrapper über SettingsPageHeader, um künftige Modul-spezifische
 * Feinabstimmungen zentral zu halten, ohne die Basis-Komponente global zu ändern.
 */
export const ModulePageHeader: React.FC<ModulePageHeaderProps> = (props) => {
  return (
    <SettingsPageHeader
      {...props}
      // Zusätzliche, leicht engere Außenabstände sind hier bewusst unterlassen,
      // damit bestehende Seiten beim späteren Einsatz gezielt entscheiden können.
    />
  );
};

export default ModulePageHeader;
