import React from 'react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export interface SettingsPageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  heading: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  backTo?: string;
  backLabel?: string;
}

export const SettingsPageHeader: React.FC<SettingsPageHeaderProps> = ({ className, heading, description, actions, backTo, backLabel, ...props }) => {
  return (
    <div
      className={cn(
        'mb-4 sm:mb-5 flex flex-col gap-2 sm:gap-3 rounded-xl sm:rounded-[1.15rem] border border-[#2d3246] bg-[linear-gradient(180deg,#141728_0%,#121524_100%)] p-4 sm:p-5 shadow-astra relative overflow-hidden',
        className,
      )}
      {...props}
    >
      <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0)_42%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_95%_5%,rgba(75,70,200,0.08)_0%,rgba(75,70,200,0)_50%)] pointer-events-none" />
      {backTo && (
        <Link
          to={backTo}
          className="relative z-10 inline-flex items-center gap-1.5 text-[0.85rem] text-[#9ca2be] hover:text-astra-cyan transition-colors w-fit -mt-1 mb-1 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>{backLabel || 'Zurück'}</span>
        </Link>
      )}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div className="space-y-1 sm:space-y-1.5 min-w-0">
          <h1 className="text-[1.15rem] sm:text-[1.3rem] lg:text-[1.45rem] font-semibold leading-tight tracking-[-0.015em] text-white">{heading}</h1>
          {description && <p className="text-[0.88rem] sm:text-[0.95rem] lg:text-[0.98rem] leading-relaxed text-[#9ca2be]">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2 self-start">{actions}</div>}
      </div>
    </div>
  );
};

export default SettingsPageHeader;
