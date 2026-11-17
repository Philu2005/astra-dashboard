import React from 'react';
import { cn } from '@/lib/utils';

export interface SettingsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

// Wiederverwendbarer Card-Wrapper im Astra-Dashboard-Stil
export const SettingsCard: React.FC<SettingsCardProps> = ({ className, header, footer, children, ...props }) => {
  return (
    <div
      className={cn(
        'rounded-[1.1rem] border shadow-astra transition-colors duration-300',
        'bg-[linear-gradient(180deg,#141728_0%,#121524_100%)] border-[#2d3246]',
        'hover:border-astra-purple/45 motion-reduce:transition-none',
        className,
      )}
      {...props}
    >
      {header && <div className="border-b border-[#2d3246] px-5 py-4 text-[#c1c7de]">{header}</div>}
      <div className="px-5 py-4">{children}</div>
      {footer && <div className="border-t border-[#2d3246] px-5 py-4">{footer}</div>}
    </div>
  );
};

export default SettingsCard;
