import React from 'react';
import DiscordSelect, { type DiscordSelectProps } from '@/components/ui/DiscordSelect';

export type ModuleChannelSelectProps = Omit<DiscordSelectProps, 'kind'> & { kind?: 'channel' };

/**
 * Dünner Wrapper über die bestehende DiscordSelect-Komponente zur
 * Kanalauswahl. Aktiviert standardmäßig die Gruppierung nach Kategorien,
 * wenn entsprechende Daten (parent_name) vorhanden sind.
 */
export const ModuleChannelSelect: React.FC<ModuleChannelSelectProps> = ({ kind, groupByCategory = true, ...rest }) => {
  return <DiscordSelect kind={kind ?? 'channel'} groupByCategory={groupByCategory} {...rest} />;
};

export default ModuleChannelSelect;
