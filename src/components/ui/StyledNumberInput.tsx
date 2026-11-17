import React, { useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface StyledNumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  error?: string;
  hint?: string;
  step?: number;
  min?: number;
  max?: number;
  controls?: boolean; // eigene +/- Controls einblenden
}

// Nummernfeld ohne native Spinner. Optional mit eigenen +/- Controls.
export const StyledNumberInput = React.forwardRef<HTMLInputElement, StyledNumberInputProps>(
  (
    { className, error, hint, controls = false, step = 1, min, max, disabled, value, onChange, ...props },
    ref,
  ) => {
    const clamp = useCallback(
      (v: number) => {
        if (typeof min === 'number') v = Math.max(v, min);
        if (typeof max === 'number') v = Math.min(v, max);
        return v;
      },
      [min, max],
    );

    const parse = (val: unknown) => {
      const n = typeof val === 'number' ? val : parseFloat(String(val ?? ''));
      return Number.isFinite(n) ? n : 0;
    };

    const setByDelta = (delta: number) => {
      if (!onChange) return;
      const current = parse(value as any);
      const next = clamp(current + delta);
      // synthetisches Event erzeugen
      const evt = { target: { value: String(next) } } as unknown as React.ChangeEvent<HTMLInputElement>;
      onChange(evt);
    };

    return (
      <div className={cn('relative inline-flex w-full items-stretch', disabled && 'opacity-60')}>
        <input
          ref={ref}
          inputMode="decimal"
          pattern="[0-9]*"
          disabled={disabled}
          className={cn(
            'h-10 w-full rounded-md border bg-[#0f1220] pl-3',
            controls ? 'pr-12' : 'pr-3',
            'text-[0.95rem] text-white',
            'border-[#2a2f45] placeholder:text-[#7f86a8]',
            'focus:outline-none focus:border-astra-purple/40 focus:ring-0',
            'hover:border-astra-purple/25',
            'transition-colors duration-150 motion-reduce:transition-none',
            // Native Spinner entfernen (WebKit/Firefox)
            '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
            error && 'border-red-500/60 focus:border-red-400',
            className,
          )}
          value={value as any}
          onChange={onChange}
          {...props}
          type="text"
        />
        {controls && (
          <div className="pointer-events-auto absolute right-1 top-1/2 -translate-y-1/2 overflow-hidden rounded-md border border-[#2a2f45]">
            <button
              type="button"
              onClick={() => setByDelta(-parse(step as any) || -1)}
              className={cn(
                'block h-8 w-8 select-none bg-[#13162a] text-[#cfd5f0]',
                'transition-colors hover:bg-[#171b33] active:bg-[#0f1220] focus:outline-none focus-visible:ring-2 focus-visible:ring-astra-purple/40',
              )}
              aria-label="decrement"
            >
              <svg aria-hidden="true" className="mx-auto h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <div className="h-px w-full bg-[#2a2f45]" />
            <button
              type="button"
              onClick={() => setByDelta(parse(step as any) || 1)}
              className={cn(
                'block h-8 w-8 select-none bg-[#13162a] text-[#cfd5f0]',
                'transition-colors hover:bg-[#171b33] active:bg-[#0f1220] focus:outline-none focus-visible:ring-2 focus-visible:ring-astra-purple/40',
              )}
              aria-label="increment"
            >
              <svg aria-hidden="true" className="mx-auto h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}
        {(hint || error) && (
          <div className="mt-1 w-full text-[0.82rem]">
            {error ? (
              <span role="alert" className="text-red-400">{error}</span>
            ) : (
              <span className="text-[#8fa1c6]">{hint}</span>
            )}
          </div>
        )}
      </div>
    );
  },
);

StyledNumberInput.displayName = 'StyledNumberInput';

export default StyledNumberInput;
