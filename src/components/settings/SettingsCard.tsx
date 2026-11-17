import React from 'react';
import { cn } from '@/lib/utils';

export interface SettingsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export const SettingsCard: React.FC<SettingsCardProps> = ({ className, header, footer, children, ...props }) => {
  return (
    <div
      className={cn(
        'rounded-[1.15rem] border shadow-astra transition-all duration-300 relative overflow-hidden',
        'bg-[linear-gradient(180deg,#141728_0%,#121524_100%)] border-[#2d3246]',
        'hover:border-astra-purple/45 motion-reduce:transition-none',
        className,
      )}
      {...props}
    >
      <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0)_42%)] pointer-events-none" />
      {header && (
        <div className="relative z-10 border-b border-[#2d3246]/80 px-4 py-3 sm:px-5 sm:py-4 text-[#c1c7de]">
          {header}
        </div>
      )}
      <div className="relative z-10 px-4 py-3 sm:px-5 sm:py-4">{children}</div>
      {footer && (
        <div className="relative z-10 border-t border-[#2d3246]/80 px-4 py-3 sm:px-5 sm:py-4">
          {footer}
        </div>
      )}
    </div>
  );
};

export default SettingsCard;
