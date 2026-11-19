import { useMemo } from 'react';
import { type GuildChannel, type GuildCategory } from '@/services/servers-api';
import { type DiscordEntity } from '@/components/ui/DiscordSelect';

/**
 * Hook zur einheitlichen Aufbereitung von Discord-Kanälen für die DiscordSelect-Komponente.
 * Gruppiert Kanäle nach Kategorien und stellt sicher, dass parent_name korrekt gesetzt ist.
 */
export function useChannelResources(channels: GuildChannel[], categories: GuildCategory[] = []) {
  const channelResources = useMemo((): DiscordEntity[] => {
    // 1. Map für Kategorien (für schnellen Zugriff)
    const categoryMap = new Map<string, GuildCategory>();
    categories.forEach(cat => categoryMap.set(cat.id, cat));

    // 2. Kanäle transformieren
    const transformedChannels = channels.map(ch => {
      const category = ch.parent_id ? categoryMap.get(ch.parent_id) : undefined;
      return {
        id: ch.id,
        name: ch.name || ch.id,
        type: ch.type,
        parent_id: ch.parent_id ?? null,
        parent_name: category ? category.name : (ch.parent_id ? `Kategorie ${ch.parent_id}` : null),
        position: ch.position,
        categoryPosition: category ? category.position : 1000000,
      };
    });

    // 3. Kategorien ohne Kanäle finden
    const channelParentIds = new Set(channels.map(ch => ch.parent_id).filter(Boolean));
    const emptyCategories = categories
      .filter(cat => !channelParentIds.has(cat.id))
      .map(cat => ({
        id: `cat-${cat.id}`, 
        name: cat.name,
        type: 4, 
        parent_id: cat.id, 
        parent_name: cat.name,
        position: -1, 
        categoryPosition: cat.position,
        isCategoryOnly: true, 
      }));

    // WICHTIG: Wir sortieren das flache Array nicht hier, da DiscordSelect die Gruppierung übernimmt.
    // Aber wir stellen sicher, dass alle Daten vorhanden sind.
    return [...transformedChannels, ...emptyCategories];
  }, [channels, categories]);

  // Nur Text-Kanäle (Type 0 oder 5 - Announcement)
  const textChannelResources = useMemo(() => 
    channelResources.filter(ch => ch.type === 0 || ch.type === 5),
    [channelResources]
  );

  return {
    channelResources,
    textChannelResources,
    categories, // Auch die rohen Kategorien zurückgeben
  };
}
