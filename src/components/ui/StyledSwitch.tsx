import React from 'react';
import { cn } from '@/lib/utils';

export interface StyledSwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: React.ReactNode;
  hint?: string;
  error?: string;
}

// Professioneller Toggle: dunkler Track, violetter aktiver Zustand, flüssiger Thumb
export const StyledSwitch = React.forwardRef<HTMLButtonElement, StyledSwitchProps>(
  ({ className, checked, defaultChecked, onChange, disabled, label, hint, error, ...props }, ref) => {
    const isControlled = checked !== undefined;
    const [internal, setInternal] = React.useState<boolean>(Boolean(defaultChecked));
    const c = isControlled ? Boolean(checked) : internal;

    const toggle = () => {
      if (disabled) return;
      const next = !c;
      if (!isControlled) setInternal(next);
      onChange?.(next);
    };

    return (
      <div className={cn('flex items-start gap-3', disabled && 'opacity-60', className)}>
        <button
          ref={ref}
          type="button"
          role="switch"
          aria-checked={c}
          aria-disabled={disabled}
          onClick={toggle}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-all duration-200',
            'border-[#2a2f45] bg-[#0f1220] shadow-astra',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-astra-purple/40',
            'hover:border-astra-purple/35',
            c && 'border-astra-purple/60 bg-astra-purple/25',
          )}
          {...props}
        >
          <span
            className={cn(
              'absolute left-0.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-[#cfd5f0] transition-all duration-200',
              'shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_2px_8px_rgba(0,0,0,0.35)]',
              c ? 'translate-x-5 bg-[#e6ecff]' : 'translate-x-0',
            )}
          />
        </button>
        {(label || hint || error) && (
          <span className="flex min-w-0 flex-col">
            {label && <span className="text-[0.95rem] leading-5 text-[#dbe3ff]">{label}</span>}
            {(hint || error) && (
              <span className={cn('text-[0.82rem]', error ? 'text-red-400' : 'text-[#8fa1c6]')}>{error || hint}</span>
            )}
          </span>
        )}
      </div>
    );
  },
);

StyledSwitch.displayName = 'StyledSwitch';

export default StyledSwitch;
