import React, { useEffect, useMemo, useState } from 'react';
import StyledSelect, { type SelectOption } from '@/components/ui/StyledSelect';
import { FolderTree, Hash, Volume2, Megaphone, Video, AtSign } from 'lucide-react';

export type DiscordSelectKind = 'channel' | 'role' | 'category';

export interface DiscordEntity {
  id: string;
  name: string;
  color?: number;
  // Optional für Channels
  type?: number;
  parent_id?: string | null;
  parent_name?: string | null;
}

export interface DiscordSelectProps {
  label?: string;
  placeholder?: string;
  value: string | null;
  onChange: (id: string) => void;
  loading?: boolean;
  error?: string | null;
  items: DiscordEntity[];
  kind: DiscordSelectKind;
  disabled?: boolean;
  className?: string;
  // Nur für Channels: nach Kategorien gruppieren, wenn parent_name vorhanden ist
  groupByCategory?: boolean;
}

function roleColorToStyle(color?: number): React.CSSProperties | undefined {
  if (!color || color === 0) return undefined;
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  return { color: `rgb(${r} ${g} ${b})` };
}

export const DiscordSelect: React.FC<DiscordSelectProps> = ({
  label,
  placeholder = 'Auswählen…',
  value,
  onChange,
  loading,
  error,
  items,
  kind,
  disabled,
  className,
  groupByCategory,
}) => {
  const options: SelectOption[] = useMemo(() => {
    const channelIcon = (t?: number) => {
      switch (t) {
        case 2: // Voice
          return <Volume2 className="h-4 w-4" />;
        case 5: // Announcement
          return <Megaphone className="h-4 w-4" />;
        case 13: // Stage (approx)
          return <AtSign className="h-4 w-4" />;
        case 15: // Forum
          return <Hash className="h-4 w-4" />;
        case 0: // Text
        default:
          return <Hash className="h-4 w-4" />;
      }
    };

    const iconFor = (ent: DiscordEntity) => {
      if (kind === 'role') {
        return <div className="h-3 w-3 rounded-full" style={{ backgroundColor: roleColorToStyle(ent.color)?.color || '#7289da' }} />;
      }
      if (kind === 'category') return <FolderTree className="h-4 w-4" />;
      if (kind === 'channel') return channelIcon(ent.type);
      return null;
    };

    // Gruppierung nur für Channels und wenn parent_name Daten vorhanden sind
    if (kind === 'channel' && (groupByCategory || items.some(i => i.parent_name))) {
      const groups = new Map<string, DiscordEntity[]>();
      const UNCATEGORIZED = '__uncategorized__';
      for (const it of items) {
        const key = (it.parent_name || '').trim() || UNCATEGORIZED;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(it);
      }
      const out: SelectOption[] = [];
      for (const [group, ents] of groups) {
        if (group !== UNCATEGORIZED) {
          // Gruppenüberschriften sind nicht auswählbar → disabled
          out.push({ type: 'group', value: `g-${group}`, label: group, disabled: true } as SelectOption);
        } else {
          out.push({ type: 'group', value: `g-__none__`, label: 'Ohne Kategorie', disabled: true } as SelectOption);
        }
        for (const it of ents) {
          out.push({
            value: it.id,
            label: it.name || it.id,
            description: `#${it.id}`,
            icon: iconFor(it) ?? undefined,
          });
        }
      }
      return out;
    }

    // Standard: flache Liste
    return items.map((it) => ({
      value: it.id,
      label: kind === 'channel' ? (it.name?.startsWith('#') ? it.name : `# ${it.name}`) : (it.name || it.id),
      description: `ID: ${it.id}`,
      icon: iconFor(it) ?? undefined,
    }));
  }, [items, kind, groupByCategory]);

  const current = value ?? '';

  return (
    <div className={className}>
      {label && <label className="mb-1 block text-[0.85rem] font-medium text-[#c1c7de]">{label}</label>}
      <StyledSelect
        options={options}
        value={current}
        onChange={(v) => onChange(v)}
        placeholder={loading ? 'Laden…' : error ? `Fehler: ${error}` : placeholder}
        disabled={disabled || loading}
        searchable
      />
      {error && <p className="mt-1 text-[0.8rem] text-red-300">{error}</p>}
    </div>
  );
};

export default DiscordSelect;
