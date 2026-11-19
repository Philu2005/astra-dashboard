import { useMemo } from 'react';
import { type GuildChannel, type GuildCategory } from '@/services/servers-api';
import { type DiscordEntity } from '@/components/ui/DiscordSelect';

/**
 * Hook zur einheitlichen Aufbereitung von Discord-Kanälen für die DiscordSelect-Komponente.
 * Gruppiert Kanäle nach Kategorien und stellt sicher, dass parent_name korrekt gesetzt ist.
 */
export function useChannelResources(channels: GuildChannel[], categories: GuildCategory[] = []) {
  const channelResources = useMemo((): DiscordEntity[] => {
    // 1. Map für schnellen Zugriff auf Namen und Positionen
    const nameMap = new Map<string, string>();
    const posMap = new Map<string, number>();
    
    // Zuerst Kategorien in die Map
    categories.forEach(cat => {
      nameMap.set(cat.id, cat.name || cat.id);
      if (cat.position !== undefined) {
        posMap.set(cat.id, cat.position);
      }
    });
    
    // Dann Kanäle
    channels.forEach(ch => {
      if (!nameMap.has(ch.id)) {
        nameMap.set(ch.id, ch.name || ch.id);
      }
    });

    // 2. Kanäle transformieren und parent_name/position auflösen
    return channels.map(ch => ({
      id: ch.id,
      name: ch.name || ch.id,
      type: ch.type,
      parent_id: ch.parent_id ?? null,
      parent_name: ch.parent_id ? (nameMap.get(ch.parent_id) || null) : null,
      // WICHTIG: position des Kanals für die Sortierung innerhalb der Gruppe erhalten
      position: ch.position ?? 0,
      // Optionale Information für die Kategorie-Sortierung
      categoryPosition: ch.parent_id ? (posMap.get(ch.parent_id) ?? 999999) : 999999,
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
