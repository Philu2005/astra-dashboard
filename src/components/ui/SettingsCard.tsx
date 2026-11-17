import React from 'react';
import { cn } from '@/lib/utils';

export interface SettingsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  headerRight?: React.ReactNode;
}

// Dunkle Card im Astra-Dashboard-Stil für Einstellungsgruppen.
// Leicht abgestufte Hintergründe, violett-graue Border, dezente Schatten.
export const SettingsCard: React.FC<SettingsCardProps> = ({
  title,
  description,
  headerRight,
  className,
  children,
  ...props
}) => {
  return (
    <section
      className={cn(
        'rounded-xl border border-[#2a2f45]/80 bg-[#0e1120]/80 shadow-[0_8px_30px_rgba(0,0,0,0.25)]',
        'backdrop-blur-[1px] transition-[transform,box-shadow] duration-200',
        'hover:shadow-[0_10px_36px_rgba(0,0,0,0.35)] hover:-translate-y-[1px]',
        'motion-reduce:transition-none',
        className,
      )}
      {...props}
    >
      {(title || description || headerRight) && (
        <div className="flex items-start justify-between gap-4 border-b border-[#2a2f45]/70 px-6 py-5">
          <div>
            {title && (
              <h3 className="text-[1.05rem] font-medium tracking-[-0.01em] text-[#e7e9f6]">{title}</h3>
            )}
            {description && (
              <p className="mt-1 text-[0.9rem] leading-6 text-[#9fa8c8]">{description}</p>
            )}
          </div>
          {headerRight && <div className="shrink-0">{headerRight}</div>}
        </div>
      )}
      <div className="px-6 py-5">{children}</div>
    </section>
  );
};

export default SettingsCard;
