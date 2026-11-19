import { useMemo } from 'react';
import { type GuildChannel } from '@/services/servers-api';
import { type DiscordEntity } from '@/components/ui/DiscordSelect';

/**
 * Hook zur einheitlichen Aufbereitung von Discord-Kanälen für die DiscordSelect-Komponente.
 * Gruppiert Kanäle nach Kategorien und stellt sicher, dass parent_name korrekt gesetzt ist.
 */
export function useChannelResources(channels: GuildChannel[]) {
  const channelResources = useMemo((): DiscordEntity[] => {
    // 1. Map für schnellen Zugriff auf Kanalnamen (insb. Kategorien) erstellen
    const channelMap = new Map<string, string>();
    channels.forEach(ch => {
      channelMap.set(ch.id, ch.name || ch.id);
    });

    // 2. Kanäle transformieren und parent_name auflösen
    return channels.map(ch => ({
      id: ch.id,
      name: ch.name || ch.id,
      type: ch.type,
      parent_id: ch.parent_id ?? null,
      parent_name: ch.parent_id ? (channelMap.get(ch.parent_id) ?? null) : null,
    }));
  }, [channels]);

  // Nur Text-Kanäle (Type 0 oder undefined)
  const textChannelResources = useMemo(() => 
    channelResources.filter(ch => !ch.type || ch.type === 0),
    [channelResources]
  );

  return {
    channelResources,
    textChannelResources,
  };
}
