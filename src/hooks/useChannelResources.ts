import { useMemo } from 'react';
import { type GuildChannel, type GuildCategory } from '@/services/servers-api';
import { type DiscordEntity } from '@/components/ui/DiscordSelect';

/**
 * Hook zur einheitlichen Aufbereitung von Discord-Kanälen für die DiscordSelect-Komponente.
 * Gruppiert Kanäle nach Kategorien und stellt sicher, dass parent_name korrekt gesetzt ist.
 */
export function useChannelResources(channels: GuildChannel[], categories: GuildCategory[] = []) {
  const channelResources = useMemo((): DiscordEntity[] => {
    // 1. Map für schnellen Zugriff auf Namen (Kategorien und Kanäle)
    const nameMap = new Map<string, string>();
    
    // Zuerst Kategorien in die Map (haben Vorrang für parent_id Auflösung)
    categories.forEach(cat => {
      nameMap.set(cat.id, cat.name || cat.id);
    });
    
    // Dann Kanäle (falls parent_id auf einen Kanal verweist oder Kategorien als Kanäle mitkommen)
    channels.forEach(ch => {
      if (!nameMap.has(ch.id)) {
        nameMap.set(ch.id, ch.name || ch.id);
      }
    });

    // 2. Kanäle transformieren und parent_name auflösen
    return channels.map(ch => ({
      id: ch.id,
      name: ch.name || ch.id,
      type: ch.type,
      parent_id: ch.parent_id ?? null,
      parent_name: ch.parent_id ? (nameMap.get(ch.parent_id) || null) : null,
    }));
  }, [channels, categories]);

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
