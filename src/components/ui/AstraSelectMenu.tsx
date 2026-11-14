import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface AstraSelectItem {
  value: string;
  label: string;
}

export interface AstraSelectMenuProps {
  value: string;
  onChange: (value: string) => void;
  items: AstraSelectItem[];
  placeholder?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  menuClassName?: string;
  'aria-label'?: string;
}

/**
 * Nicht-natives Select mit eigenem Dropdown-Menü im Astra-Stil.
 * - Dunkle Oberfläche, dezente Border, weiche Schatten
 * - Eigener Chevron, Hover-/Focus-States
 * - Schließt bei Outside-Click oder Escape
 * - Minimal-Tastatur-Support: Tab-Fokus, Escape
 */
export const AstraSelectMenu: React.FC<AstraSelectMenuProps> = ({
  value,
  onChange,
  items,
  placeholder = 'Auswählen…',
  disabled,
  fullWidth = true,
  className,
  menuClassName,
  ...rest
}) => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const id = useId();

  const selected = useMemo(() => items.find(i => i.value === value) || null, [items, value]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target) && btnRef.current && !btnRef.current.contains(target)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className={cn('relative', fullWidth ? 'w-full' : 'inline-block')}>
      <button
        {...rest}
        ref={btnRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`astra-select-${id}`}
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={cn(
          'h-10 w-full px-3 pr-9 rounded-md border text-[0.95rem] text-white',
          'bg-[#0f1220] border-[#2a2f45] hover:border-astra-purple/25 focus:outline-none focus:border-astra-purple/40',
          disabled && 'opacity-60 cursor-not-allowed',
          className,
        )}
      >
        <span className={cn('truncate', !selected && 'text-[#8a90ad]')}>{selected?.label ?? placeholder}</span>
        <svg aria-hidden="true" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a90ad]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          ref={menuRef}
          id={`astra-select-${id}`}
          role="listbox"
          className={cn(
            'absolute z-50 mt-1 w-full rounded-xl border bg-[#0b0e1a] text-white',
            'border-[#2a2f45] shadow-[0_10px_30px_rgba(0,0,0,0.45),0_0_0_1px_rgba(125,227,255,0.06)] overflow-hidden',
            menuClassName,
          )}
        >
          <div className="max-h-64 overflow-y-auto py-1">
            {items.map((item) => {
              const selectedItem = item.value === value;
              return (
                <button
                  type="button"
                  key={item.value}
                  role="option"
                  aria-selected={selectedItem}
                  onClick={() => { onChange(item.value); setOpen(false); }}
                  className={cn(
                    'w-full flex items-center justify-between text-left px-3 py-2 text-[0.95rem]',
                    selectedItem ? 'bg-astra-purple/15 text-[#e6e2ff]' : 'hover:bg-[#12172a] text-[#d6dbf0]'
                  )}
                >
                  <span className="truncate">{item.label}</span>
                  {selectedItem && (
                    <svg aria-hidden="true" className="h-4 w-4 text-astra-cyan" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AstraSelectMenu;
