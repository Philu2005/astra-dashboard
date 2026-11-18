import React from 'react';
import { cn } from '@/lib/utils';
import { StyledButton } from '@/components/ui/StyledButton';

export interface FloatingActionBarProps {
  className?: string;
  saving?: boolean;
  disabled?: boolean;
  onSave: () => void;
  onCancel?: () => void;
  cancelLabel?: string;
  saveLabel?: string;
}

// Kompakte, zentrierte, schwebende Aktionsleiste für Formular-Dirty-State
export const FloatingActionBar: React.FC<FloatingActionBarProps> = ({
  className,
  saving,
  disabled,
  onSave,
  onCancel,
  cancelLabel = 'Abbrechen',
  saveLabel = 'Änderungen übernehmen',
}) => {
  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex justify-center px-3',
        'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95',
        className,
      )}
      role="region"
      aria-label="Änderungsleiste"
    >
      <div
        className={cn(
          'pointer-events-auto inline-flex items-center gap-3 rounded-2xl border border-[#2a2f45] bg-[#111427]/95 px-3 py-2 shadow-[0_12px_30px_-10px_rgba(0,0,0,0.6)]',
          'backdrop-blur supports-[backdrop-filter]:backdrop-blur-md',
        )}
      >
        {onCancel && (
          <StyledButton variant="ghost" size="md" onClick={onCancel} disabled={saving}>
            {cancelLabel}
          </StyledButton>
        )}
        <StyledButton variant="primary" size="md" onClick={onSave} disabled={saving || disabled}>
          {saving ? 'Speichere…' : saveLabel}
        </StyledButton>
      </div>
    </div>
  );
};

export default FloatingActionBar;
