import React from 'react';
import { cn } from '@/lib/utils';

export interface SettingsSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  heading: React.ReactNode;
  description?: React.ReactNode;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({ className, heading, description, children, ...props }) => {
  return (
    <section className={cn('space-y-3', className)} {...props}>
      <header className="space-y-1">
        <h3 className="text-[1.05rem] font-semibold tracking-[-0.01em] text-white">{heading}</h3>
        {description && <p className="text-[0.95rem] leading-6 text-[#9ca2be]">{description}</p>}
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  );
};

export default SettingsSection;
