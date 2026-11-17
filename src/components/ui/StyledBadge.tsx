import React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'purple' | 'cyan';

export interface StyledBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[#151a2d] text-[#dbe3ff] border-[#333a55]',
  success: 'bg-[rgba(34,197,94,0.1)] text-[#a6f4c5] border-[rgba(34,197,94,0.25)]',
  warning: 'bg-[rgba(234,179,8,0.1)] text-[#fde68a] border-[rgba(234,179,8,0.25)]',
  danger: 'bg-[rgba(239,68,68,0.1)] text-[#fecaca] border-[rgba(239,68,68,0.25)]',
  purple: 'bg-astra-purple/15 text-[#b9b5ff] border-astra-purple/35',
  cyan: 'bg-astra-cyan/15 text-[#b9f4ff] border-astra-cyan/35',
};

export const StyledBadge = React.forwardRef<HTMLSpanElement, StyledBadgeProps>(
  ({ className, children, variant = 'default', ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.82rem] font-medium',
          'shadow-astra transition-colors duration-150',
          variantClasses[variant],
          className,
        )}
        {...props}
      >
        {children}
      </span>
    );
  },
);

StyledBadge.displayName = 'StyledBadge';

export default StyledBadge;
