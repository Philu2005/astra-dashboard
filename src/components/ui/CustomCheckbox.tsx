import React, { useId } from 'react';
import { cn } from '@/lib/utils';

export interface CustomCheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: string;
}

// Hochwertige, dunkle Checkbox im Astra-Stil mit animiertem Checkmark.
export const CustomCheckbox = React.forwardRef<HTMLInputElement, CustomCheckboxProps>(
  ({ className, label, description, error, disabled, ...props }, ref) => {
    const id = useId();
    return (
      <label
        htmlFor={id}
        className={cn(
          'group relative flex cursor-pointer select-none items-start gap-3',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        <span
          className={cn(
            'relative mt-0.5 inline-flex h-[18px] w-[18px] items-center justify-center rounded-[6px]',
            'border border-[#3a3f63] bg-[#0f1326] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]',
            'transition-colors duration-200 will-change-transform group-hover:border-astra-purple/40',
            'focus-within:outline-none focus-within:ring-2 focus-within:ring-astra-purple/50 focus-within:ring-offset-0',
            'motion-reduce:transition-none',
          )}
        >
          {/* Visuell verstecktes natives Input für A11y */}
          <input
            id={id}
            ref={ref}
            type="checkbox"
            disabled={disabled}
            className="peer absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-[6px] opacity-0"
            {...props}
          />
          {/* Hintergrund bei aktiv */}
          <span
            aria-hidden
            className={cn(
              'pointer-events-none absolute inset-0 rounded-[6px] bg-astra-purple/0 transition-colors duration-200',
              'peer-checked:bg-astra-purple/90',
              'motion-reduce:transition-none',
            )}
          />
          {/* Checkmark */}
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className={cn(
              'h-3.5 w-3.5 text-white opacity-0 transition-all duration-200',
              'peer-checked:opacity-100 peer-checked:scale-100 scale-90',
              'motion-reduce:transition-none',
            )}
            fill="none"
          >
            <path
              d="M5 12.5l4 4 10-10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        {(label || description || error) && (
          <span className="inline-flex min-w-0 flex-col">
            {label && (
              <span className={cn('text-[0.95rem] text-[#e6e9f8]')}>{label}</span>
            )}
            {description && (
              <span className="text-[0.86rem] text-[#9fa8c8]">{description}</span>
            )}
            {error && (
              <span role="alert" className="text-[0.86rem] text-red-400">{error}</span>
            )}
          </span>
        )}
      </label>
    );
  },
);

CustomCheckbox.displayName = 'CustomCheckbox';

export default CustomCheckbox;
