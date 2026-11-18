import React from 'react';
import SettingsCard, { type SettingsCardProps } from '@/components/settings/SettingsCard';

export interface ModuleSettingsCardProps extends Omit<SettingsCardProps, 'header' | 'footer'> {
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Dünner Wrapper über SettingsCard mit gleicher API.
 * Erlaubt spätere modul-spezifische Feinjustierung ohne globale Änderungen.
 */
export const ModuleSettingsCard: React.FC<ModuleSettingsCardProps> = ({ header, footer, children, ...rest }) => {
  return (
    <SettingsCard header={header} footer={footer} {...rest}>
      {children}
    </SettingsCard>
  );
};

export default ModuleSettingsCard;
