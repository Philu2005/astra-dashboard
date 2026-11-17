import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
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
}

// Dunkler, animierter Select mit eigenem Dropdown (ohne native <select>)
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
}) => {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<string | null>(defaultValue);
  const current = isControlled ? (value ?? null) : internal;
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(() => options.find(o => (current ?? '') === o.value) || null, [options, current]);

  const commit = useCallback(
    (next: string) => {
      if (!isControlled) setInternal(next);
      onChange?.(next);
      setOpen(false);
      // focus trigger again for a11y
      setTimeout(() => buttonRef.current?.focus(), 0);
    },
    [isControlled, onChange],
  );

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen(true);
        setActiveIndex(Math.max(0, options.findIndex(o => o.value === current) ?? 0));
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const dir = e.key === 'ArrowDown' ? 1 : -1;
      let idx = activeIndex;
      for (let i = 0; i < options.length; i++) {
        idx = (idx + dir + options.length) % options.length;
        if (!options[idx]?.disabled) break;
      }
      setActiveIndex(idx);
      const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${idx}"]`);
      el?.scrollIntoView({ block: 'nearest' });
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const opt = options[activeIndex];
      if (opt && !opt.disabled) commit(opt.value);
    }
  };

  return (
    <div ref={rootRef} className={cn('w-full', disabled && 'opacity-60', className)}>
      {label && <div className="mb-1.5 text-[0.95rem] text-[#dbe3ff]">{label}</div>}
      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls="astra-select-listbox"
        aria-disabled={disabled}
        disabled={disabled}
        onClick={() => setOpen(v => !v)}
        onKeyDown={onKeyDown}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border bg-[#0f1220] px-3 text-left text-[0.95rem] text-white',
          'border-[#2a2f45] hover:border-astra-purple/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-astra-purple/40',
          'transition-colors duration-150 motion-reduce:transition-none',
          error && 'border-red-500/60 focus-visible:ring-red-400',
        )}
      >
        <span className={cn('flex min-w-0 items-center gap-2', !selected && 'text-[#7f86a8]')}>
          {selected?.icon}
          <span className="truncate">{selected ? selected.label : placeholder}</span>
        </span>
        <svg aria-hidden="true" className={cn('h-4 w-4 text-[#9aa2c3] transition-transform', open && 'rotate-180')} viewBox="0 0 24 24" fill="none">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div
        id="astra-select-listbox"
        role="listbox"
        aria-activedescendant={activeIndex >= 0 ? `opt-${activeIndex}` : undefined}
        className={cn(
          'relative z-20',
          // container for absolute dropdown
        )}
      >
        <div
          ref={listRef}
          className={cn(
            'absolute mt-1 w-full overflow-auto rounded-md border bg-[#121524] shadow-astra',
            'border-[#333a55] focus:outline-none',
            'transition-all duration-150 origin-top motion-reduce:transition-none',
            open ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0',
            'max-h-64',
          )}
        >
          {options.map((opt, idx) => (
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
                'flex cursor-pointer items-center gap-2 px-3 py-2 text-[0.95rem]',
                'transition-colors',
                opt.disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-astra-purple/10',
                current === opt.value ? 'text-astra-purple' : 'text-[#dbe3ff]',
              )}
            >
              {opt.icon && <span className="text-[#9b95ff]">{opt.icon}</span>}
              <span className="truncate">{opt.label}</span>
            </div>
          ))}
        </div>
      </div>
      {(hint || error) && (
        <div className="mt-1 text-[0.82rem]">{error ? <span className="text-red-400">{error}</span> : <span className="text-[#8fa1c6]">{hint}</span>}</div>
      )}
    </div>
  );
};

export default StyledSelect;
