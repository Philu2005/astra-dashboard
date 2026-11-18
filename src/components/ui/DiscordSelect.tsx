import React, { useMemo, useCallback, useState, useRef } from 'react';
import StyledSelect, { type SelectOption } from '@/components/ui/StyledSelect';
import { FolderTree, Hash, Volume2, Megaphone, AtSign, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DiscordSelectKind = 'channel' | 'role' | 'category';

export interface DiscordEntity {
  id: string;
  name: string;
  color?: number;
  type?: number;
  parent_id?: string | null;
  parent_name?: string | null;
}

export interface DiscordSelectProps {
  label?: string;
  placeholder?: string;
  value: string | null;
  onChange: (id: string) => void;
  multiValue?: string[] | null;
  onMultiChange?: (ids: string[]) => void;
  loading?: boolean;
  error?: string | null;
  items: DiscordEntity[];
  kind: DiscordSelectKind;
  disabled?: boolean;
  className?: string;
  groupByCategory?: boolean;
}

function roleColorToHex(color?: number): string {
  if (!color || color === 0) return '#7289da';
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  return `rgb(${r},${g},${b})`;
}

const channelIcon = (t?: number) => {
  switch (t) {
    case 2: return <Volume2 className="h-4 w-4" />;
    case 5: return <Megaphone className="h-4 w-4" />;
    case 13: return <AtSign className="h-4 w-4" />;
    case 15: return <Hash className="h-4 w-4" />;
    case 0:
    default: return <Hash className="h-4 w-4" />;
  }
};

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
  const isMulti = Array.isArray(multiValue);
  const [inlineSearch, setInlineSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const iconFor = useCallback((ent: DiscordEntity) => {
    if (kind === 'role') {
      return <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: roleColorToHex(ent.color) }} />;
    }
    if (kind === 'category') return <FolderTree className="h-4 w-4" />;
    if (kind === 'channel') return channelIcon(ent.type);
    return null;
  }, [kind]);

  const options: SelectOption[] = useMemo(() => {
    // Grouped channels
    if (kind === 'channel' && (groupByCategory || items.some(i => i.parent_name))) {
      const groups = new Map<string, DiscordEntity[]>();
      const UNCATEGORIZED = '__uncategorized__';
      for (const it of items) {
        const key = (it.parent_name || '').trim() || UNCATEGORIZED;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(it);
      }
      const out: SelectOption[] = [];
      for (const [group, ents] of groups) {
        out.push({
          type: 'group',
          value: `g-${group}`,
          label: group === UNCATEGORIZED ? 'Ohne Kategorie' : group,
          disabled: true,
        } as SelectOption);
        for (const it of ents) {
          out.push({
            value: it.id,
            label: it.name || it.id,
            icon: iconFor(it) ?? undefined,
          });
        }
      }
      return out;
    }

    // Flat list
    return items.map((it) => ({
      value: it.id,
      label: it.name || it.id,
      icon: iconFor(it) ?? undefined,
    }));
  }, [items, kind, groupByCategory, iconFor]);

  // Entity lookup for chips
  const entityMap = useMemo(() => new Map(items.map(it => [it.id, it])), [items]);
  const optionMap = useMemo(() => new Map(options.filter(o => o.type !== 'group').map(o => [o.value, o])), [options]);


  const handleChange = useCallback((v: string) => {
    if (isMulti) {
      const ids = new Set<string>(multiValue ?? []);
      if (ids.has(v)) ids.delete(v); else ids.add(v);
      onMultiChange?.(Array.from(ids));
      setInlineSearch('');
    } else {
      onChange(v);
    }
  }, [isMulti, multiValue, onMultiChange, onChange]);

  const removeChip = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isMulti) return;
    const next = (multiValue ?? []).filter(x => x !== id);
    onMultiChange?.(next);
  }, [isMulti, multiValue, onMultiChange]);

  // Render a single chip
  const renderChip = (id: string) => {
    const ent = entityMap.get(id);
    const opt = optionMap.get(id);
    const name = ent?.name || opt?.label || id;
    const icon = ent ? iconFor(ent) : opt?.icon;

    return (
      <span
        key={id}
        className={cn(
          'inline-flex items-center gap-1 rounded-md border border-[#2a2f52] bg-[#161b35] px-2 py-0.5',
          'text-[0.82rem] text-white leading-tight',
          'transition-colors duration-100',
        )}
      >
        {icon && <span className="shrink-0 text-[#7c78c9] [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>}
        <span className="max-w-[120px] truncate">{name}</span>
        {isMulti && (
          <button
            type="button"
            aria-label={`${name} entfernen`}
            className="ml-0.5 shrink-0 rounded p-0.5 text-[#6b7194] hover:text-white hover:bg-[#2a2f52] focus:outline-none focus-visible:ring-1 focus-visible:ring-astra-purple/40 transition-colors duration-100"
            onMouseDown={e => removeChip(id, e)}
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </span>
    );
  };

  // Effective placeholder
  const effectivePlaceholder = loading ? 'Laden…' : error ? `Fehler: ${error}` : placeholder;

  // For multi-select: custom trigger with chips + inline input
  if (isMulti) {
    return (
      <div className={className}>
        {label && <label className="mb-1.5 block text-[0.85rem] font-medium text-[#c1c7de]">{label}</label>}
        <StyledSelect
          options={options}
          value={value ?? ''}
          onChange={handleChange}
          placeholder={effectivePlaceholder}
          disabled={disabled || loading}
          searchable={false}
          externalSearch={inlineSearch}
          keepOpenOnSelect
          selectedValues={multiValue ?? []}
          renderTrigger={({ open, onClick, ref, onKeyDown }) => (
            <div
              ref={ref}
              role="combobox"
              aria-expanded={open}
              aria-disabled={disabled}
              tabIndex={disabled ? -1 : 0}
              onClick={() => {
                onClick();
                // Focus inline input after opening
                setTimeout(() => inputRef.current?.focus(), 0);
              }}
              onKeyDown={onKeyDown}
              className={cn(
                'flex min-h-[42px] w-full flex-wrap items-center gap-1.5',
                'rounded-lg border bg-[#0d1025] px-2.5 py-1.5',
                'text-left text-[0.9rem] text-white cursor-pointer',
                'border-[#252a40] hover:border-[#3a3f5c]',
                'transition-colors duration-150 motion-reduce:transition-none',
                'focus-within:ring-2 focus-within:ring-astra-purple/40 focus-within:border-astra-purple/40',
                'focus:outline-none',
                disabled && 'cursor-not-allowed opacity-60',
              )}
            >
              {(multiValue ?? []).length === 0 && !inlineSearch && (
                <span className="text-[#5c6180] select-none py-0.5">{effectivePlaceholder}</span>
              )}
              {(multiValue ?? []).map(id => renderChip(id))}
              <input
                ref={inputRef}
                type="text"
                value={inlineSearch}
                onChange={e => setInlineSearch(e.target.value)}
                placeholder={(multiValue ?? []).length > 0 ? 'ändern …' : ''}
                className={cn(
                  'min-w-[60px] flex-1 bg-transparent py-0.5 text-[0.85rem] text-white',
                  'placeholder-[#5c6180] outline-none',
                )}
                disabled={disabled}
                onClick={e => e.stopPropagation()}
                onFocus={() => { if (!open) onClick(); }}
              />
              <ChevronDown className={cn(
                'h-4 w-4 shrink-0 text-[#5c6180] transition-transform duration-200 motion-reduce:transition-none ml-auto',
                open && 'rotate-180',
              )} />
            </div>
          )}
        />
        {error && <p className="mt-1 text-[0.8rem] text-red-300">{error}</p>}
      </div>
    );
  }

  // Single-select: use default StyledSelect trigger with consistent styling
  return (
    <div className={className}>
      {label && <label className="mb-1.5 block text-[0.85rem] font-medium text-[#c1c7de]">{label}</label>}
      <StyledSelect
        options={options}
        value={value ?? ''}
        onChange={handleChange}
        placeholder={effectivePlaceholder}
        disabled={disabled || loading}
        searchable
        selectedValues={value ? [value] : []}
      />
      {error && <p className="mt-1 text-[0.8rem] text-red-300">{error}</p>}
    </div>
  );
};

export default DiscordSelect;
