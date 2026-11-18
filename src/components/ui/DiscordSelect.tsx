import React, { useEffect, useMemo, useState } from 'react';
import StyledSelect, { type SelectOption } from '@/components/ui/StyledSelect';
import { FolderTree, Hash, Volume2, Megaphone, Video, AtSign, X, Check, Search } from 'lucide-react';

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
  // Bestehende API beibehalten (Single-Select)
  value: string | null;
  onChange: (id: string) => void;
  // Optional: Multi-Select ohne Breaking Change
  multiValue?: string[] | null;
  onMultiChange?: (ids: string[]) => void;
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
  multiValue,
  onMultiChange,
  loading,
  error,
  items,
  kind,
  disabled,
  className,
  groupByCategory,
}) => {
  const isMulti = Array.isArray((multiValue ?? undefined));
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

  // Geschlossener Zustand mit Chips (bei Multi-Select)
  const triggerContent = () => {
    if (!isMulti) return null; // StyledSelect rendert Single-Trigger selbst
    const ids = (multiValue as string[] | null) ?? [];
    const byId = new Map(options.filter(o=>o.type!== 'group').map(o=>[o.value,o] as const));
    return (
      <div className="flex min-h-10 w-full items-center gap-1.5 rounded-md border border-[#2a2f45] bg-[#0f1220] px-2.5 py-1.5 text-left text-[0.92rem] text-white focus-within:ring-2 focus-within:ring-astra-purple/40">
        {ids.length === 0 && (
          <span className="text-[#7f86a8] select-none">{loading ? 'Laden…' : error ? `Fehler: ${error}` : (placeholder || 'ändern …')}</span>
        )}
        {ids.map(id=>{
          const o = byId.get(id);
          return (
            <span key={id} className="inline-flex items-center gap-1 rounded-full border border-[#2a2f45] bg-[#14182d] px-2 py-0.5 text-[0.82rem]">
              {o?.icon && <span className="text-[#9b95ff] [&>svg]:h-3.5 [&>svg]:w-3.5">{o.icon}</span>}
              <span className="max-w-[140px] truncate">{o?.label ?? id}</span>
              <button
                type="button"
                aria-label="Entfernen"
                className="ml-0.5 rounded-full p-0.5 text-[#9aa2c3] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-astra-purple/40"
                onClick={(e)=>{
                  e.stopPropagation();
                  const next = ids.filter(x=>x!==id);
                  onMultiChange?.(next);
                }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          );
        })}
        {/* Dummy input für direkten Textfokus im Trigger */}
        <input
          aria-hidden
          tabIndex={-1}
          className="h-5 flex-1 bg-transparent outline-none placeholder-[#7f86a8]"
          placeholder={ids.length? 'ändern …' : ''}
          readOnly
        />
      </div>
    );
  };

  return (
    <div className={className}>
      {label && <label className="mb-1 block text-[0.85rem] font-medium text-[#c1c7de]">{label}</label>}
      <StyledSelect
        options={options}
        value={value ?? ''}
        onChange={(v) => {
          if (isMulti) {
            const ids = new Set<string>(Array.isArray(multiValue) ? multiValue! : []);
            if (ids.has(v)) ids.delete(v); else ids.add(v);
            onMultiChange?.(Array.from(ids));
          } else {
            onChange(v);
          }
        }}
        placeholder={loading ? 'Laden…' : error ? `Fehler: ${error}` : placeholder}
        disabled={disabled || loading}
        searchable
        // Für Multi: benutzerdefinierten Trigger-Inhalt (Chips) anzeigen
        // StyledSelect ignoriert children, wir platzieren Content daneben:
        className={isMulti ? 'discord-multiselect' : undefined}
      />
      {isMulti && (
        <div className="mt-2 -mb-1">{triggerContent()}</div>
      )}
      {error && <p className="mt-1 text-[0.8rem] text-red-300">{error}</p>}
    </div>
  );
};

export default DiscordSelect;
