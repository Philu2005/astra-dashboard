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

// Hochwertiger Pill-Switch: ON/OFF im Track, Astra-Purple aktiv, flüssiger Knob
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

    const onKeyDown = (e: React.KeyboardEvent) => {
      // Space und Enter: preventDefault um doppelten Toggle durch native button-Klick zu verhindern
      if (e.key === ' ') {
        e.preventDefault();
        toggle();
      }
      // Enter: native buttons feuern onClick bei Enter – wir verhindern den Default
      // und toggeln manuell, damit kein doppelter Toggle entsteht
      if (e.key === 'Enter') {
        e.preventDefault();
        toggle();
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (c && !disabled) { if (!isControlled) setInternal(false); onChange?.(false); }
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (!c && !disabled) { if (!isControlled) setInternal(true); onChange?.(true); }
      }
    };

    const switchId = React.useId();

    return (
      <div className={cn('flex items-start gap-3', className)}>
        <button
          ref={ref}
          id={switchId}
          type="button"
          role="switch"
          aria-checked={c}
          disabled={disabled}
          onClick={toggle}
          onKeyDown={onKeyDown}
          className={cn(
            // Größerer Pill-Switch: 56×28 für ON/OFF + Knob
            'relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full border',
            'transition-colors duration-200 ease-out motion-reduce:transition-none',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-astra-purple/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1220]',
            c
              ? 'border-[#5b56d6]/60 bg-astra-purple hover:bg-[#5b56d6]'
              : 'border-[#2a2f45] bg-[#1a1f33] hover:border-[#3a4060]',
            disabled && 'pointer-events-none opacity-50 cursor-default',
          )}
          {...props}
        >
          {/* ON/OFF Labels im Track */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex select-none items-center"
          >
            {/* ON – links vom Knob, sichtbar wenn aktiv */}
            <span
              className={cn(
                'absolute left-1.5 text-[0.6rem] font-bold uppercase tracking-wider',
                'transition-opacity duration-150 motion-reduce:transition-none',
                c ? 'text-white/90 opacity-100' : 'opacity-0',
              )}
            >
              ON
            </span>
            {/* OFF – rechts vom Knob, sichtbar wenn inaktiv */}
            <span
              className={cn(
                'absolute right-1.5 text-[0.6rem] font-bold uppercase tracking-wider',
                'transition-opacity duration-150 motion-reduce:transition-none',
                c ? 'opacity-0' : 'text-[#6b7194] opacity-100',
              )}
            >
              OFF
            </span>
          </span>

          {/* Knob */}
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute top-[3px] h-[22px] w-[22px] rounded-full',
              'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.2)]',
              'transition-transform duration-200 ease-out motion-reduce:transition-none will-change-transform',
              c ? 'translate-x-[29px]' : 'translate-x-[3px]',
            )}
          />
        </button>

        {(label || hint || error) && (
          <label htmlFor={switchId} className={cn('flex min-w-0 flex-col', disabled ? 'cursor-default' : 'cursor-pointer')}>
            {label && <span className="text-[0.95rem] leading-5 text-[#dbe3ff]">{label}</span>}
            {(hint || error) && (
              <span className={cn('text-[0.82rem]', error ? 'text-red-400' : 'text-[#8fa1c6]')}>{error || hint}</span>
            )}
          </label>
        )}
      </div>
    );
  },
);

StyledSwitch.displayName = 'StyledSwitch';

export default StyledSwitch;
