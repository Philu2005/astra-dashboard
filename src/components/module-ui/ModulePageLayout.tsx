import React from 'react';
import { cn } from '@/lib/utils';

export interface ModulePageLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Optional: legt fest, ob der Inhalt in zwei Spalten auf Desktop aufgeteilt wird.
   * Mobil immer einspaltig.
   */
  twoColumns?: boolean;
  /**
   * Maximalbreite des Inhaltsbereichs. Standard: 1200px.
   */
  maxWidthClassName?: string;
}

/**
 * Schlanker Seitenrahmen ausschließlich für Modul-Seiten.
 * Keine globalen Styles, nur lokale Utility-Klassen.
 */
export const ModulePageLayout: React.FC<ModulePageLayoutProps> = ({
  className,
  children,
  twoColumns,
  maxWidthClassName = 'max-w-[1200px]',
  ...rest
}) => {
  return (
    <div className={cn('w-full px-4 sm:px-6 lg:px-8', className)} {...rest}>
      <div className={cn('mx-auto', maxWidthClassName)}>
        <div
          className={cn(
            twoColumns
              ? 'grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[minmax(0,58%)_1fr]'
              : 'flex flex-col gap-4 sm:gap-6',
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default ModulePageLayout;
