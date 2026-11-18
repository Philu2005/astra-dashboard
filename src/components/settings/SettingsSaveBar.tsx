import React from 'react';
import { cn } from '@/lib/utils';
import { StyledButton } from '@/components/ui/StyledButton';

export interface SettingsSaveBarProps extends React.HTMLAttributes<HTMLDivElement> {
  dirty?: boolean;
  saving?: boolean;
  onSave?: () => void;
  onCancel?: () => void;
  saveLabel?: string;
  cancelLabel?: string;
}

export const SettingsSaveBar: React.FC<SettingsSaveBarProps> = ({
  className,
  dirty = false,
  saving = false,
  onSave,
  onCancel,
  saveLabel = 'Speichern',
  cancelLabel = 'Verwerfen',
  ...props
}) => {
  if (!dirty && !saving) return null;

  return (
    <div
      className={cn('pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-3', className)}
      {...props}
    >
      <div
        className={cn(
          'pointer-events-auto inline-flex items-center gap-3 rounded-2xl border border-[#2a2f45] bg-[#111427]/95 px-3 py-2',
          'shadow-[0_12px_30px_-10px_rgba(0,0,0,0.6)] backdrop-blur supports-[backdrop-filter]:backdrop-blur-md',
          'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95',
        )}
        role="region"
        aria-label="Änderungsleiste"
        style={{
          // Safe-Area respektieren
          paddingBottom: 'max(0px, env(safe-area-inset-bottom))',
        }}
      >
        <div className="hidden sm:flex items-center gap-2 pr-1">
          <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-astra-purple shadow-[0_0_8px_rgba(75,70,200,0.6)]" />
          <span className="text-[0.85rem] text-[#c1c7de]">
            {saving ? 'Speichern läuft…' : 'Ungespeicherte Änderungen'}
          </span>
        </div>
        {onCancel && (
          <StyledButton variant="ghost" size="md" onClick={onCancel} disabled={saving}>
            {cancelLabel}
          </StyledButton>
        )}
        <StyledButton variant="primary" size="md" onClick={onSave} loading={saving}>
          {saveLabel}
        </StyledButton>
      </div>
    </div>
  );
};

export default SettingsSaveBar;
