import React from 'react';
import { cn } from '@/lib/utils';

export interface ModuleSettingsRowProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  /**
   * Wenn true, wird die rechte Spalte oben ausgerichtet (für mehrzeilige Controls sinnvoll).
   */
  alignTop?: boolean;
}

/**
 * Zweispaltige Zeile: links Label/Description, rechts das Control.
 * Mobil stackend, Desktop zweispaltig. Keine Logik, nur Layout.
 */
export const ModuleSettingsRow: React.FC<ModuleSettingsRowProps> = ({
  className,
  label,
  description,
  alignTop,
  children,
  ...rest
}) => {
  return (
    <div className={cn('grid grid-cols-1 gap-3 sm:grid-cols-[1fr_2fr] sm:gap-4', className)} {...rest}>
      <div className="min-w-0">
        {label && <div className="text-[0.95rem] font-medium text-[#dbe3ff] leading-5">{label}</div>}
        {description && <div className="mt-0.5 text-[0.85rem] text-[#8fa1c6] leading-relaxed">{description}</div>}
      </div>
      <div className={cn('min-w-0', alignTop ? 'sm:self-start' : 'sm:self-center')}>{children}</div>
    </div>
  );
};

export default ModuleSettingsRow;
