import React from 'react';
import { cn } from '@/lib/utils';

export interface StyledInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// Einheitlich gestyltes Text-/Eingabefeld im Astra-Stil.
export const StyledInput = React.forwardRef<HTMLInputElement, StyledInputProps>(
  ({ className, error, hint, leftIcon, rightIcon, disabled, ...props }, ref) => {
    return (
      <div className={cn('relative', disabled && 'opacity-60')}>
        {leftIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8a90ad]">{leftIcon}</span>
        )}
        <input
          ref={ref}
          disabled={disabled}
          className={cn(
            'h-10 w-full rounded-md border bg-[#0f1220] text-[0.95rem] text-white',
            'border-[#2a2f45] placeholder:text-[#7f86a8]',
            'focus:outline-none focus:border-astra-purple/40 focus:ring-0',
            'hover:border-astra-purple/25',
            leftIcon ? 'pl-10 pr-3' : 'px-3',
            rightIcon ? 'pr-10' : '',
            'transition-colors duration-150 motion-reduce:transition-none',
            error && 'border-red-500/60 focus:border-red-400',
            className,
          )}
          {...props}
        />
        {rightIcon && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8a90ad]">{rightIcon}</span>
        )}
        {(hint || error) && (
          <div className="mt-1 text-[0.82rem]">
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

StyledInput.displayName = 'StyledInput';

export default StyledInput;
