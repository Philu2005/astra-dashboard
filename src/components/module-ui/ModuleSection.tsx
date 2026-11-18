import React from 'react';
import SettingsSection, { type SettingsSectionProps } from '@/components/settings/SettingsSection';

export type ModuleSectionProps = SettingsSectionProps;

export const ModuleSection: React.FC<ModuleSectionProps> = (props) => {
  return <SettingsSection {...props} />;
};

export default ModuleSection;
