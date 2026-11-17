import React from 'react';
import { cn } from '@/lib/utils';

export interface SettingsSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  columns?: 1 | 2 | 3;
}

// Abschnitt innerhalb einer SettingsCard. Bildet klare visuelle Hierarchie.
export const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  description,
  columns = 2,
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn('py-4 first:pt-0 last:pb-0', className)} {...props}>
      <div className="mb-4">
        <h4 className="text-[0.98rem] font-medium tracking-[-0.01em] text-[#dfe3f6]">{title}</h4>
        {description && <p className="mt-1 text-[0.9rem] text-[#9fa8c8]">{description}</p>}
      </div>
      <div
        className={cn(
          'gap-4',
          columns === 1 && 'grid grid-cols-1',
          columns === 2 && 'grid grid-cols-1 md:grid-cols-2',
          columns === 3 && 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        )}
      >
        {children}
      </div>
    </div>
  );
};

export default SettingsSection;
