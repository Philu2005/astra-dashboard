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
        'mb-5 flex flex-col gap-3 rounded-[1.1rem] border border-[#2d3246] bg-[linear-gradient(180deg,#141728_0%,#121524_100%)] p-5 shadow-astra',
        className,
      )}
      {...props}
    >
      {backTo && (
        <Link
          to={backTo}
          className="inline-flex items-center gap-1.5 text-[0.85rem] text-[#9ca2be] hover:text-white transition-colors w-fit -mt-1 mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{backLabel || 'Zurück'}</span>
        </Link>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-[1.45rem] font-semibold leading-6 tracking-[-0.015em] text-white">{heading}</h1>
          {description && <p className="text-[0.98rem] leading-6 text-[#9ca2be]">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
};

export default SettingsPageHeader;
