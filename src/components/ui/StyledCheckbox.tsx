import React from 'react';
import { cn } from '@/lib/utils';

export interface StyledCheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  hint?: string;
  error?: string;
}

// Dunkle, animierte Checkbox im Astra-Stil mit violettem aktivem Zustand
export const StyledCheckbox = React.forwardRef<HTMLInputElement, StyledCheckboxProps>(
  ({ className, label, hint, error, disabled, checked, defaultChecked, onChange, ...props }, ref) => {
    const [internalChecked, setInternalChecked] = React.useState<boolean>(Boolean(defaultChecked));
    const isControlled = checked !== undefined;
    const c = isControlled ? Boolean(checked) : internalChecked;

    const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) setInternalChecked(e.target.checked);
      onChange?.(e);
    };

    return (
      <label
        className={cn(
          'group flex cursor-pointer select-none items-start gap-3',
          disabled && 'cursor-not-allowed opacity-60',
          className,
        )}
      >
        <span
          className={cn(
            'relative mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-[0.5rem] border',
            'bg-[#0f1220] border-[#2a2f45] transition-all duration-200 motion-reduce:transition-none',
            'shadow-astra',
            'group-hover:border-astra-purple/35',
            c && 'border-astra-purple/60 bg-astra-purple/15',
          )}
        >
          {/* Checkmark */}
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className={cn(
              'h-3.5 w-3.5 text-astra-purple transition-all duration-200',
              c ? 'opacity-100 scale-100' : 'opacity-0 scale-75',
            )}
          >
            <path
              d="M20 6L9 17L4 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <input
            ref={ref}
            type="checkbox"
            className="peer absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-[0.5rem] focus:outline-none focus-visible:ring-2 focus-visible:ring-astra-purple/40"
            disabled={disabled}
            checked={checked}
            defaultChecked={defaultChecked}
            onChange={handleToggle}
            {...props}
          />
        </span>
        {(label || hint || error) && (
          <span className="flex min-w-0 flex-col">
            {label && <span className="text-[0.95rem] leading-5 text-[#dbe3ff]">{label}</span>}
            {(hint || error) && (
              <span className={cn('text-[0.82rem]', error ? 'text-red-400' : 'text-[#8fa1c6]')}>{error || hint}</span>
            )}
          </span>
        )}
      </label>
    );
  },
);

StyledCheckbox.displayName = 'StyledCheckbox';

export default StyledCheckbox;
