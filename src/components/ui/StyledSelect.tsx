import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { Check, Search } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  description?: string;
  // Optional: Gruppenheader. Wird als nicht-auswählbarer Titel gerendert
  type?: 'option' | 'group';
}

export interface StyledSelectProps {
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  label?: React.ReactNode;
  hint?: string;
  error?: string;
  searchable?: boolean;
  /** External search string (overrides internal search) */
  externalSearch?: string;
  /** Custom trigger renderer – receives open state and selected option */
  renderTrigger?: (props: {
    open: boolean;
    selected: SelectOption | null;
    disabled?: boolean;
    placeholder: string;
    onClick: () => void;
    ref: React.Ref<HTMLDivElement>;
    onKeyDown: (e: React.KeyboardEvent) => void;
  }) => React.ReactNode;
  /** If true, dropdown stays open after selecting (useful for multi-select) */
  keepOpenOnSelect?: boolean;
  /** Show checkmark next to selected value(s) */
  selectedValues?: string[];
}

// Dunkler, animierter Select mit eigenem Dropdown (Portal-basiert)
export const StyledSelect: React.FC<StyledSelectProps> = ({
  value,
  defaultValue = null,
  onChange,
  options,
  placeholder = 'Auswählen…',
  className,
  disabled,
  label,
  hint,
  error,
  searchable,
  externalSearch,
  renderTrigger,
  keepOpenOnSelect,
  selectedValues,
}) => {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<string | null>(defaultValue);
  const current = isControlled ? (value ?? null) : internal;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [internalSearch, setInternalSearch] = useState('');
  const search = externalSearch !== undefined ? externalSearch : internalSearch;
  const setSearch = (v: string) => { if (externalSearch === undefined) setInternalSearch(v); };

  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const selected = useMemo(() => options.find(o => (current ?? '') === o.value) || null, [options, current]);

  // Determine which values are "selected" for checkmark display
  const checkedSet = useMemo(() => {
    if (selectedValues) return new Set(selectedValues);
    if (current) return new Set([current]);
    return new Set<string>();
  }, [selectedValues, current]);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    // Filter options, keep group headers only if they have visible children
    const result: SelectOption[] = [];
    let currentGroup: SelectOption | null = null;
    let groupHasChildren = false;

    for (const o of options) {
      if (o.type === 'group') {
        // Flush previous group if it had children
        if (currentGroup && groupHasChildren) {
          result.push(currentGroup);
          // Add all buffered children (they're already in result)
        }
        currentGroup = o;
        groupHasChildren = false;
      } else {
        const matches = o.label.toLowerCase().includes(q);
        if (matches) {
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

  const showSearch = searchable ?? true;

  const commit = useCallback(
    (next: string) => {
      if (!isControlled) setInternal(next);
      onChange?.(next);
      if (!keepOpenOnSelect) {
        setOpen(false);
        setSearch('');
        setTimeout(() => {
          (triggerRef.current || buttonRef.current)?.focus();
        }, 0);
      }
    },
    [isControlled, onChange, keepOpenOnSelect],
  );

  // Position dropdown relative to trigger using portal
  const updatePosition = useCallback(() => {
    const el = triggerRef.current || buttonRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const maxH = 320;
    const openAbove = spaceBelow < maxH && spaceAbove > spaceBelow;

    setDropdownStyle({
      position: 'fixed',
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
      transform: 'translateZ(0)',
      ...(openAbove
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 }),
      maxHeight: Math.min(maxH, openAbove ? spaceAbove - 8 : spaceBelow - 8),
      overflowY: 'auto',
      overflowX: 'hidden',
      boxSizing: 'border-box',
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

  useEffect(() => {
    if (open && showSearch) {
      setTimeout(() => {
        try {
          searchRef.current?.focus({ preventScroll: true } as any);
        } catch {
          searchRef.current?.focus();
        }
      }, 0);
    }
  }, [open, showSearch]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (listRef.current?.contains(target)) return;
      setOpen(false);
      setSearch('');
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen(true);
        setActiveIndex(Math.max(0, filteredOptions.findIndex(o => o.value === current) ?? 0));
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
      let idx = activeIndex;
      for (let i = 0; i < filteredOptions.length; i++) {
        idx = (idx + dir + filteredOptions.length) % filteredOptions.length;
        if (!filteredOptions[idx]?.disabled && filteredOptions[idx]?.type !== 'group') break;
      }
      setActiveIndex(idx);
    }
    if (e.key === 'Enter' || (e.key === ' ' && !showSearch)) {
      e.preventDefault();
      const opt = filteredOptions[activeIndex];
      if (opt && !opt.disabled && opt.type !== 'group') commit(opt.value);
    }
  };

  const toggleOpen = useCallback(() => {
    if (!disabled) setOpen(v => !v);
  }, [disabled]);

  const dropdown = open ? createPortal(
    <div
      ref={listRef}
      role="listbox"
      style={dropdownStyle}
      className={cn(
        'overflow-y-auto overflow-x-hidden box-border will-change-transform',
        'rounded-xl border border-[#2a2f45]/80 bg-[#0d1025] text-white',
        'shadow-[0_8px_32px_-8px_rgba(0,0,0,0.7),0_0_0_1px_rgba(75,70,200,0.06)]',
        'animate-in fade-in-0 slide-in-from-top-1.5 duration-[160ms] ease-out',
        'motion-reduce:transition-none motion-reduce:animate-none',
      )}
      onKeyDown={onKeyDown}
    >
      {showSearch && (
        <div className="sticky top-0 z-10 bg-[#0d1025] px-2.5 pt-2.5 pb-1.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7194]" />
            <input
              ref={searchRef}
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
        {filteredOptions.filter(o => o.type !== 'group').length === 0 && (
          <div className="px-3 py-4 text-center text-[0.85rem] text-[#6b7194]">Keine Ergebnisse</div>
        )}
        {filteredOptions.map((opt, idx) => {
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
          const isChecked = checkedSet.has(opt.value);
          const isActive = idx === activeIndex;
          const isDisabled = Boolean(opt.disabled);
          return (
            <div
              key={opt.value}
              id={`opt-${idx}`}
              data-index={idx}
              role="option"
              aria-selected={isChecked}
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseDown={e => e.preventDefault()}
              onClick={() => !isDisabled && commit(opt.value)}
              className={cn(
                'group mx-1.5 flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[0.88rem]',
                'transition-colors duration-100 motion-reduce:transition-none',
                isDisabled && 'cursor-not-allowed opacity-40',
                isActive && !isChecked && 'bg-[#1a1f38]',
                isChecked && 'bg-astra-purple/15 text-white',
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
              <span className="min-w-0 flex-1 truncate">{opt.label}</span>
              {isChecked && (
                <Check className="h-4 w-4 shrink-0 text-astra-purple" />
              )}
            </div>
          );
        })}
      </div>
    </div>,
    document.body,
  ) : null;

  // Custom trigger support
  if (renderTrigger) {
    return (
      <div ref={rootRef} className={cn('w-full', disabled && 'opacity-60', className)}>
        {label && <div className="mb-1.5 text-[0.95rem] text-[#dbe3ff]">{label}</div>}
        {renderTrigger({
          open,
          selected,
          disabled,
          placeholder,
          onClick: toggleOpen,
          ref: triggerRef,
          onKeyDown,
        })}
        {dropdown}
        {(hint || error) && (
          <div className="mt-1 text-[0.82rem]">{error ? <span className="text-red-400">{error}</span> : <span className="text-[#8fa1c6]">{hint}</span>}</div>
        )}
      </div>
    );
  }

  // Default trigger (button)
  return (
    <div ref={rootRef} className={cn('w-full', disabled && 'opacity-60', className)}>
      {label && <div className="mb-1.5 text-[0.95rem] text-[#dbe3ff]">{label}</div>}
      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-disabled={disabled}
        disabled={disabled}
        onClick={toggleOpen}
        onKeyDown={onKeyDown}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-lg border bg-[#0d1025] px-3 text-left text-[0.9rem] text-white',
          'border-[#252a40] hover:border-[#3a3f5c]',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-astra-purple/40',
          'transition-colors duration-150 motion-reduce:transition-none',
          error && 'border-red-500/60 focus-visible:ring-red-400',
        )}
      >
        <span className={cn('flex min-w-0 items-center gap-2', !selected && 'text-[#5c6180]')}>
          {selected?.icon && <span className="shrink-0 text-[#9b95ff] [&>svg]:h-4 [&>svg]:w-4">{selected.icon}</span>}
          <span className="truncate">{selected ? selected.label : placeholder}</span>
        </span>
        <svg
          aria-hidden="true"
          className={cn(
            'h-4 w-4 shrink-0 text-[#5c6180] transition-transform duration-200 motion-reduce:transition-none',
            open && 'rotate-180',
          )}
          viewBox="0 0 24 24"
          fill="none"
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {dropdown}
      {(hint || error) && (
        <div className="mt-1 text-[0.82rem]">{error ? <span className="text-red-400">{error}</span> : <span className="text-[#8fa1c6]">{hint}</span>}</div>
      )}
    </div>
  );
};

export default StyledSelect;
