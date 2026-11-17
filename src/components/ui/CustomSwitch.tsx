import React, { useId } from 'react';
import { cn } from '@/lib/utils';

export interface CustomSwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: React.ReactNode;
}

// Hochwertiger Switch mit sanft gleitendem Thumb, Tastatur-bedienbar.
export const CustomSwitch = React.forwardRef<HTMLInputElement, CustomSwitchProps>(
  ({ className, label, description, disabled, ...props }, ref) => {
    const id = useId();
    return (
      <label htmlFor={id} className={cn('group flex cursor-pointer items-center gap-4', disabled && 'opacity-60 cursor-not-allowed')}>
        <span className="relative inline-flex h-6 w-11 items-center">
          <input
            id={id}
            ref={ref}
            type="checkbox"
            disabled={disabled}
            className="peer absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0"
            {...props}
          />
          {/* Track */}
          <span
            aria-hidden
            className={cn(
              'absolute inset-0 rounded-full bg-[#1a1f36] transition-colors duration-200',
              'border border-[#2f3452]',
              'peer-checked:bg-astra-purple/80 peer-checked:border-astra-purple/50',
              'group-hover:border-astra-purple/40',
              'motion-reduce:transition-none',
            )}
          />
          {/* Thumb */}
          <span
            aria-hidden
            className={cn(
              'absolute left-0.5 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white/95 shadow',
              'transition-[left,transform,box-shadow] duration-200 will-change-transform',
              'peer-checked:left-[calc(100%-1.125rem)]',
              'group-active:scale-95',
              'motion-reduce:transition-none',
            )}
          />
        </span>
        {(label || description) && (
          <span className="inline-flex min-w-0 flex-col">
            {label && <span className="text-[0.95rem] text-[#e6e9f8]">{label}</span>}
            {description && <span className="text-[0.86rem] text-[#9fa8c8]">{description}</span>}
          </span>
        )}
      </label>
    );
  },
);

CustomSwitch.displayName = 'CustomSwitch';

export default CustomSwitch;
