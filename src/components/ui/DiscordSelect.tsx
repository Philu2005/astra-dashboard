import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { FolderTree, Hash, Volume2, Megaphone, AtSign, X, ChevronDown, Search, Check } from 'lucide-react';

export type DiscordSelectKind = 'channel' | 'role' | 'category';

export interface DiscordEntity {
  id: string;
  name: string;
  color?: number;
  type?: number;
  parent_id?: string | null;
  parent_name?: string | null;
  emoji?: string | null;
  position?: number;
  categoryPosition?: number;
  isCategoryOnly?: boolean;
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

// ─── Grouped options builder ───────────────────────────────────────────────────
interface InternalOption {
  type: 'group' | 'option';
  value: string;
  label: string;
  icon?: React.ReactNode;
  emoji?: string | null;
  disabled?: boolean;
}

function buildOptions(
  items: DiscordEntity[],
  kind: DiscordSelectKind,
  groupByCategory?: boolean,
): InternalOption[] {
  const iconFor = (ent: DiscordEntity): React.ReactNode => {
    if (kind === 'role') return <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: roleColorToHex(ent.color) }} />;
    if (kind === 'category') return <FolderTree className="h-4 w-4" />;
    if (kind === 'channel') return channelIcon(ent.type);
    return null;
  };

  if (kind === 'channel' && groupByCategory) {
    const UNCATEGORIZED = '__uncategorized__';
    // Map: Category ID -> { name, items, position }
    const groupsMap = new Map<string, { name: string; items: DiscordEntity[]; position: number }>();

    // 1. Alle verfügbaren Gruppen initialisieren
    // Zuerst "Ohne Kategorie" am Ende
    groupsMap.set(UNCATEGORIZED, { name: 'Ohne Kategorie', items: [], position: 1000000 });

    // WICHTIG: Zuerst alle Einträge verarbeiten, die NUR Kategorien sind (isCategoryOnly),
    // damit die korrekten Positionsdaten der API Vorrang haben.
    for (const it of items) {
      if (it.isCategoryOnly) {
        const catId = it.parent_id || it.id;
        groupsMap.set(catId, {
          name: it.name,
          items: [],
          position: it.categoryPosition ?? 999999
        });
      }
    }

    // Dann alle Kanäle den Gruppen zuordnen
    for (const it of items) {
      if (it.isCategoryOnly) continue;

      const parentId = it.parent_id || UNCATEGORIZED;
      
      if (!groupsMap.has(parentId)) {
        // Fallback: Falls ein Kanal eine parent_id hat, zu der keine Kategorie-Entität geliefert wurde
        groupsMap.set(parentId, {
          name: (it.parent_name || '').trim() || `Kategorie ${parentId}`,
          items: [],
          position: it.categoryPosition ?? 999999
        });
      }

      groupsMap.get(parentId)!.items.push(it);
    }

    const out: InternalOption[] = [];
    
    // 2. Gruppen nach Position sortieren
    const sortedGroups = Array.from(groupsMap.entries())
      .sort((a, b) => a[1].position - b[1].position);

    for (const [key, group] of sortedGroups) {
      // Wir zeigen die Gruppe an, wenn sie Kanäle hat ODER wenn es eine echte Kategorie ist (nicht "Ohne Kategorie" wenn leer)
      if (group.items.length === 0 && key === UNCATEGORIZED) continue;
      
      out.push({
        type: 'group',
        value: `g-${key}`,
        label: group.name,
        disabled: true,
      });

      // Kanäle innerhalb der Gruppe nach Position sortieren
      const sortedItems = [...group.items].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      for (const it of sortedItems) {
        out.push({
          type: 'option',
          value: it.id,
          label: it.name || it.id,
          icon: iconFor(it) ?? undefined,
          emoji: it.emoji ?? null,
        });
      }
    }
    return out;
  }

  // Fallback / Keine Gruppierung: Nur nach Position sortieren
  return [...items]
    .filter(it => !it.isCategoryOnly)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map(it => ({
      type: 'option' as const,
      value: it.id,
      label: it.name || it.id,
      icon: iconFor(it) ?? undefined,
      emoji: it.emoji ?? null,
    }));
}

// ─── Component ─────────────────────────────────────────────────────────────────
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
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);

  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const inlineInputRef = useRef<HTMLInputElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const options = useMemo(() => buildOptions(items, kind, groupByCategory), [items, kind, groupByCategory]);
  const entityMap = useMemo(() => new Map(items.map(it => [it.id, it])), [items]);

  // Selected IDs set
  const selectedIds = useMemo(() => {
    if (isMulti) return new Set(multiValue ?? []);
    if (value) return new Set([value]);
    return new Set<string>();
  }, [isMulti, multiValue, value]);

  // Filtered options (search)
  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    const result: InternalOption[] = [];
    let currentGroup: InternalOption | null = null;
    let groupHasChildren = false;

    for (const o of options) {
      if (o.type === 'group') {
        currentGroup = o;
        groupHasChildren = false;
      } else {
        if (o.label.toLowerCase().includes(q)) {
          if (currentGroup && !groupHasChildren) {
            result.push(currentGroup);
            groupHasChildren = true;
          }
          result.push(o);
        }
      }
    }
    return result;
  }, [options, search]);

  const selectableOptions = useMemo(() => filtered.filter(o => o.type !== 'group' && !o.disabled), [filtered]);

  // ── Position dropdown ──
  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const maxH = 340;
    const openAbove = spaceBelow < maxH && spaceAbove > spaceBelow;

    setDropdownStyle({
      position: 'fixed',
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
      transform: 'translateZ(0)',
      pointerEvents: 'auto',
      userSelect: 'none',
      ...(openAbove
        ? { bottom: window.innerHeight - rect.top + 6 }
        : { top: rect.bottom + 6 }),
      maxHeight: Math.min(maxH, openAbove ? spaceAbove - 12 : spaceBelow - 12),
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open, updatePosition]);

  // Focus search when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (isMulti) {
          inlineInputRef.current?.focus();
        } else {
          searchInputRef.current?.focus({ preventScroll: true } as FocusOptions);
        }
      }, 10);
    }
  }, [open, isMulti]);

  // Click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (dropdownRef.current?.contains(t)) return;
      setOpen(false);
      setSearch('');
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // ── Handlers ──
  const toggleOpen = useCallback(() => {
    if (disabled) return;
    setOpen(v => {
      if (v) { setSearch(''); }
      return !v;
    });
  }, [disabled]);

  const commitValue = useCallback((id: string) => {
    if (isMulti) {
      const ids = new Set(multiValue ?? []);
      if (ids.has(id)) ids.delete(id); else ids.add(id);
      onMultiChange?.(Array.from(ids));
      setSearch('');
      // Keep open for multi
    } else {
      onChange(id);
      setOpen(false);
      setSearch('');
    }
  }, [isMulti, multiValue, onMultiChange, onChange]);

  const removeChip = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isMulti) {
      onMultiChange?.((multiValue ?? []).filter(x => x !== id));
    } else {
      // Single-select clear
      onChange('');
    }
  }, [isMulti, multiValue, onMultiChange, onChange]);

  // Keyboard
  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!open) {
      if (['ArrowDown', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        setOpen(true);
        setActiveIndex(0);
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      setSearch('');
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const dir = e.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex(prev => {
        let idx = prev;
        for (let i = 0; i < filtered.length; i++) {
          idx = (idx + dir + filtered.length) % filtered.length;
          const o = filtered[idx];
          if (o && o.type !== 'group' && !o.disabled) return idx;
        }
        return prev;
      });
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const opt = filtered[activeIndex];
      if (opt && opt.type !== 'group' && !opt.disabled) commitValue(opt.value);
    }
  }, [open, filtered, activeIndex, commitValue]);

  // ── Effective placeholder ──
  const effectivePlaceholder = loading ? 'Laden…' : error ? `Fehler: ${error}` : placeholder;

  // ── Render chip ──
  const renderChip = (id: string, allowRemove: boolean) => {
    const ent = entityMap.get(id);
    const name = ent?.name || id;
    const emoji = ent?.emoji;
    const icon = ent ? (kind === 'channel' ? channelIcon(ent.type) : null) : null;

    return (
      <span
        key={id}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md border border-[#2a2f52] bg-[#161b35] px-2 py-1',
          'text-[0.84rem] text-white leading-tight',
          'transition-colors duration-100',
        )}
      >
        {icon && <span className="shrink-0 text-[#7c78c9] [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>}
        {emoji && <span className="text-[0.9rem]">{emoji}</span>}
        {(emoji || icon) && <span className="text-[#5c6180] text-[0.7rem]">·</span>}
        <span className="font-medium max-w-[140px] truncate">{name}</span>
        {allowRemove && (
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

  // ── Render dropdown entry ──
  const renderEntry = (opt: InternalOption, idx: number) => {
    const isChecked = selectedIds.has(opt.value);
    const isActive = idx === activeIndex;
    const ent = entityMap.get(opt.value);
    const emoji = ent?.emoji || opt.emoji;

    return (
      <div
        key={opt.value}
        role="option"
        aria-selected={isChecked}
        onMouseEnter={() => setActiveIndex(idx)}
        onMouseDown={e => e.preventDefault()}
        onClick={() => !opt.disabled && commitValue(opt.value)}
        className={cn(
          'mx-1.5 flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[0.88rem]',
          'transition-colors duration-100 motion-reduce:transition-none',
          isChecked && 'bg-astra-purple/20 text-white',
          isActive && !isChecked && 'bg-[#1a1f38]',
          !isChecked && !isActive && 'text-[#c8cee6]',
        )}
      >
        {opt.icon && (
          <span className={cn(
            'shrink-0 [&>svg]:h-4 [&>svg]:w-4',
            isChecked ? 'text-[#9b95ff]' : 'text-[#5c6180]',
          )}>
            {opt.icon}
          </span>
        )}
        {emoji && <span className="text-[0.9rem] shrink-0">{emoji}</span>}
        {(emoji || opt.icon) && <span className="text-[#5c6180] text-[0.65rem] shrink-0">·</span>}
        <span className="min-w-0 flex-1 truncate font-medium">{opt.label}</span>
        {isChecked && (
          <Check className="h-4 w-4 shrink-0 text-astra-purple" />
        )}
      </div>
    );
  };

  // ── Dropdown panel ──
  const dropdown = open ? createPortal(
    <div
      ref={dropdownRef}
      role="listbox"
      style={dropdownStyle}
      className={cn(
        'overflow-y-auto overflow-x-hidden box-border will-change-transform',
        'rounded-xl border border-[#252a40] bg-[#0d1025] text-white',
        'shadow-[0_8px_32px_-8px_rgba(0,0,0,0.7),0_0_0_1px_rgba(75,70,200,0.06)]',
        'animate-in fade-in-0 slide-in-from-top-1.5 duration-[160ms] ease-out',
        'motion-reduce:transition-none motion-reduce:animate-none',
      )}
      onKeyDown={onKeyDown}
    >
      {/* Search field in dropdown (for single-select; multi uses inline) */}
      {!isMulti && (
        <div className="sticky top-0 z-10 bg-[#0d1025] px-2.5 pt-2.5 pb-1.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7194]" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setActiveIndex(0); }}
              onKeyDown={onKeyDown}
              placeholder="Channels suchen …"
              className={cn(
                'w-full rounded-lg border border-[#252a40] bg-[#0a0d1a] py-2 pl-9 pr-3',
                'text-[0.85rem] text-white placeholder-[#5c6180]',
                'outline-none transition-colors duration-150',
                'focus:border-astra-purple/50 focus:ring-1 focus:ring-astra-purple/30',
                'motion-reduce:transition-none',
              )}
            />
          </div>
        </div>
      )}

      <div className="py-1.5">
        {selectableOptions.length === 0 && (
          <div className="px-3 py-4 text-center text-[0.85rem] text-[#6b7194]">Keine Ergebnisse</div>
        )}
        {filtered.map((opt, idx) => {
          if (opt.type === 'group') {
            return (
              <div
                key={`g-${opt.value}`}
                aria-hidden
                className="select-none px-3 pt-3.5 pb-1 text-[0.7rem] font-bold uppercase tracking-wider text-[#6b7194]"
              >
                {opt.label}
              </div>
            );
          }
          return renderEntry(opt, idx);
        })}
      </div>
    </div>,
    document.body,
  ) : null;

  // ── TRIGGER: Multi-select with chips + inline search ──
  if (isMulti) {
    const ids = multiValue ?? [];
    return (
      <div className={cn('w-full', className)}>
        {label && <label className="mb-1.5 block text-[0.85rem] font-medium text-[#c1c7de]">{label}</label>}
        <div
          ref={triggerRef}
          role="combobox"
          aria-expanded={open}
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : 0}
          onClick={() => { if (!disabled) { toggleOpen(); setTimeout(() => inlineInputRef.current?.focus(), 10); } }}
          onKeyDown={onKeyDown}
          className={cn(
            'flex min-h-[44px] w-full flex-wrap items-center gap-1.5',
            'rounded-xl border bg-[#0d1025] px-2.5 py-1.5',
            'text-left text-[0.9rem] text-white cursor-pointer',
            'border-[#252a40] hover:border-[#3a3f5c]',
            'transition-colors duration-150 motion-reduce:transition-none',
            'focus-within:ring-2 focus-within:ring-astra-purple/40 focus-within:border-astra-purple/50',
            'focus:outline-none',
            disabled && 'cursor-not-allowed opacity-60',
          )}
        >
          {ids.length === 0 && !search && (
            <span className="text-[#5c6180] select-none py-0.5">{effectivePlaceholder}</span>
          )}
          {ids.map(id => renderChip(id, true))}
          <input
            ref={inlineInputRef}
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); if (!open) setOpen(true); setActiveIndex(0); }}
            onKeyDown={onKeyDown}
            placeholder={ids.length > 0 ? 'ändern …' : ''}
            className={cn(
              'min-w-[60px] flex-1 bg-transparent py-0.5 text-[0.85rem] text-white',
              'placeholder-[#5c6180] outline-none',
            )}
            disabled={disabled}
            onClick={e => e.stopPropagation()}
          />
          <ChevronDown className={cn(
            'h-4 w-4 shrink-0 text-[#5c6180] transition-transform duration-200 motion-reduce:transition-none ml-auto',
            open && 'rotate-180',
          )} />
        </div>
        {dropdown}
        {error && <p className="mt-1 text-[0.8rem] text-red-300">{error}</p>}
      </div>
    );
  }

  // ── TRIGGER: Single-select with chip ──
  const selectedEntity = value ? entityMap.get(value) : null;
  const hasSelection = Boolean(value && selectedEntity);

  return (
    <div className={cn('w-full', className)}>
      {label && <label className="mb-1.5 block text-[0.85rem] font-medium text-[#c1c7de]">{label}</label>}
      <div
        ref={triggerRef}
        role="combobox"
        aria-expanded={open}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && toggleOpen()}
        onKeyDown={onKeyDown}
        className={cn(
          'flex min-h-[44px] w-full items-center gap-2',
          'rounded-xl border bg-[#0d1025] px-2.5 py-1.5',
          'text-left text-[0.9rem] text-white cursor-pointer',
          'border-[#252a40] hover:border-[#3a3f5c]',
          'transition-colors duration-150 motion-reduce:transition-none',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-astra-purple/40 focus-visible:border-astra-purple/50',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        {hasSelection ? (
          <>
            {renderChip(value!, true)}
            <span className="flex-1 text-[0.85rem] text-[#5c6180] select-none">ändern …</span>
          </>
        ) : (
          <span className="flex-1 text-[#5c6180] select-none py-0.5">{effectivePlaceholder}</span>
        )}
        <ChevronDown className={cn(
          'h-4 w-4 shrink-0 text-[#5c6180] transition-transform duration-200 motion-reduce:transition-none ml-auto',
          open && 'rotate-180',
        )} />
      </div>
      {dropdown}
      {error && <p className="mt-1 text-[0.8rem] text-red-300">{error}</p>}
    </div>
  );
};

export default DiscordSelect;
