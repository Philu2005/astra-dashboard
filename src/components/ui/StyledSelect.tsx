import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  description?: string;
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
}) => {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<string | null>(defaultValue);
  const current = isControlled ? (value ?? null) : internal;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [search, setSearch] = useState('');

  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  // Einmalig: CSS-Regel für ausgeblendete Scrollbars in WebKit-basierten Browsern injizieren
  useEffect(() => {
    const STYLE_ID = 'astra-select-scrollbar-style';
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      /* Nur gezielt für unser Dropdown anwenden */
      .astra-scrollbar-hide { scrollbar-width: none; -ms-overflow-style: none; }
      .astra-scrollbar-hide::-webkit-scrollbar { display: none; width: 0; height: 0; }
    `;
    document.head.appendChild(style);
  }, []);

  const selected = useMemo(() => options.find(o => (current ?? '') === o.value) || null, [options, current]);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(o => o.label.toLowerCase().includes(q));
  }, [options, search]);

  const showSearch = searchable ?? options.length > 8;

  const commit = useCallback(
    (next: string) => {
      if (!isControlled) setInternal(next);
      onChange?.(next);
      setOpen(false);
      setSearch('');
      setTimeout(() => buttonRef.current?.focus(), 0);
    },
    [isControlled, onChange],
  );

  // Position dropdown relative to button using portal
  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const maxH = 280;
    const openAbove = spaceBelow < maxH && spaceAbove > spaceBelow;

    setDropdownStyle({
      position: 'fixed',
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
      ...(openAbove
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 }),
      // Stabile, kontrollierte Höhe ohne horizontale Scrollbars
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
      setTimeout(() => searchRef.current?.focus(), 0);
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
        if (!filteredOptions[idx]?.disabled) break;
      }
      setActiveIndex(idx);
    }
    if (e.key === 'Enter' || (e.key === ' ' && !showSearch)) {
      e.preventDefault();
      const opt = filteredOptions[activeIndex];
      if (opt && !opt.disabled) commit(opt.value);
    }
  };

  const dropdown = open ? createPortal(
    <div
      ref={listRef}
      role="listbox"
      style={dropdownStyle}
      className={cn(
        'astra-scrollbar-hide overflow-y-auto overflow-x-hidden box-border',
        // Panel Look & Feel
        'rounded-lg border border-[#2a2f45] bg-[#111427]/98 text-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)]',
        // Animation
        'animate-in fade-in-0 zoom-in-95 duration-150 ease-out',
      )}
      onKeyDown={onKeyDown}
    >
      {showSearch && (
        <div className="sticky top-0 z-10 border-b border-[#2a2f45] bg-[#111427]/98 p-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur-sm">
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setActiveIndex(0); }}
            onKeyDown={onKeyDown}
            placeholder="Suchen…"
            className="w-full rounded-md border border-[#2a2f45] bg-[#0f1220] px-2.5 py-1.5 text-[0.85rem] text-white placeholder-[#7f86a8] outline-none focus:border-astra-purple/40"
          />
        </div>
      )}
      {filteredOptions.length === 0 && (
        <div className="px-3 py-3 text-[0.85rem] text-[#9aa2c3]">Keine Ergebnisse</div>
      )}
      {filteredOptions.map((opt, idx) => (
        <div
          key={opt.value}
          id={`opt-${idx}`}
          data-index={idx}
          role="option"
          aria-selected={current === opt.value}
          onMouseEnter={() => setActiveIndex(idx)}
          onMouseDown={e => e.preventDefault()}
          onClick={() => !opt.disabled && commit(opt.value)}
          className={cn(
            'flex cursor-pointer items-center gap-2 px-3 py-2 text-[0.9rem] box-border',
            'transition-colors duration-150',
            opt.disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-astra-purple/12',
            idx === activeIndex && 'bg-astra-purple/12',
            current === opt.value ? 'text-astra-purple font-medium' : 'text-[#dbe3ff]'
          )}
        >
          {opt.icon && <span className="shrink-0 text-[#9b95ff] [&>svg]:h-4 [&>svg]:w-4">{opt.icon}</span>}
          <span className="truncate" title={opt.label}>{opt.label}</span>
        </div>
      ))}
    </div>,
    document.body,
  ) : null;

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
        onClick={() => { if (!disabled) setOpen(v => !v); }}
        onKeyDown={onKeyDown}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border bg-[#0f1220] px-3 text-left text-[0.92rem] text-white box-border',
          'border-[#2a2f45] hover:border-astra-purple/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-astra-purple/40',
          'transition-colors duration-150 motion-reduce:transition-none',
          error && 'border-red-500/60 focus-visible:ring-red-400',
        )}
      >
        <span className={cn('flex min-w-0 items-center gap-2', !selected && 'text-[#7f86a8]')}>
          {selected?.icon}
          <span className="truncate" title={selected?.label || placeholder}>{selected ? selected.label : placeholder}</span>
        </span>
        <svg aria-hidden="true" className={cn('h-4 w-4 shrink-0 text-[#9aa2c3] transition-transform duration-150', open && 'rotate-180')} viewBox="0 0 24 24" fill="none">
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
