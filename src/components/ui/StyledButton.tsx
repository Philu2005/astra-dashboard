import React from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface StyledButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-astra-purple text-white hover:bg-astra-purple/90 active:bg-astra-purple/80 border-astra-purple/60 hover:border-astra-purple/70',
  secondary:
    'bg-[#14182d] text-[#dbe3ff] hover:bg-[#171b33] active:bg-[#0f1220] border-[#333a55] hover:border-astra-purple/35',
  ghost: 'bg-transparent text-[#dbe3ff] hover:bg-astra-purple/10 border-transparent',
  danger: 'bg-[#b02a37] text-white hover:bg-[#a12531] active:bg-[#8f1f2a] border-[#b02a37] hover:border-[#c23b49]',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[0.9rem] rounded-md',
  md: 'h-10 px-4 text-[0.95rem] rounded-md',
  lg: 'h-12 px-5 text-[1rem] rounded-lg',
};

export const StyledButton = React.forwardRef<HTMLButtonElement, StyledButtonProps>(
  ({ className, variant = 'secondary', size = 'md', loading = false, disabled, leftIcon, rightIcon, children, ...props }, ref) => {
    const isDisabled = disabled || loading;
    const renderIcon = (icon?: React.ReactNode) => {
      if (!icon) return null;
      // Wrapper sorgt für konsistente Icon-Größe ohne die Child-Props zu verändern
      return <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center [&>svg]:h-4 [&>svg]:w-4" aria-hidden>{icon}</span>;
    };
    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          'inline-flex flex-row flex-nowrap items-center justify-center gap-2 border transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-astra-purple/40',
          'shadow-astra select-none shrink-0 w-fit font-medium overflow-hidden whitespace-nowrap',
          variantClasses[variant],
          sizeClasses[size],
          isDisabled && 'opacity-70 cursor-not-allowed',
          className,
        )}
        {...props}
      >
        {loading && (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          </svg>
        )}
        {!loading && renderIcon(leftIcon)}
        <span className="leading-none truncate">{children}</span>
        {!loading && renderIcon(rightIcon)}
      </button>
    );
  },
);

StyledButton.displayName = 'StyledButton';

export default StyledButton;
