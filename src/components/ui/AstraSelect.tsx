import React from 'react';
import { cn } from '@/lib/utils';

export interface AstraSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  fullWidth?: boolean;
}

// Einheitlich gestyltes Select-Element im Astra-Dashboard-Stil.
// Verwendet das native <select>, um Abhängigkeiten zu vermeiden, liefert aber
// ein konsistentes Erscheinungsbild (dunkler Hintergrund, dezente Border,
// eigener Chevron, Fokus/Hover/Active-States) und eine einheitliche Höhe.
export const AstraSelect = React.forwardRef<HTMLSelectElement, AstraSelectProps>(
  ({ className, fullWidth = true, disabled, children, ...props }, ref) => {
    return (
      <div
        className={cn(
          'relative',
          fullWidth ? 'w-full' : 'inline-block'
        )}
      >
        <select
          ref={ref}
          disabled={disabled}
          className={cn(
            // Größe/Layout
            'h-10 appearance-none pr-10 pl-3 w-full',
            // Typografie
            'text-[0.95rem] text-white',
            // Oberfläche
            'rounded-md bg-[#0f1220] border border-[#2a2f45]',
            // Fokus/Hover
            'focus:outline-none focus:border-astra-purple/40',
            !disabled && 'hover:border-astra-purple/25',
            // Disabled-Zustand
            disabled && 'opacity-60 cursor-not-allowed',
            className
          )}
          {...props}
        >
          {children}
        </select>
        {/* Chevron-Icon (rein dekorativ) */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a90ad]"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }
);

AstraSelect.displayName = 'AstraSelect';

export const AstraSelectOption = 'option';

export default AstraSelect;
