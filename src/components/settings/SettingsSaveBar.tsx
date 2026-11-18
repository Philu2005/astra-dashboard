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
          'pointer-events-auto inline-flex items-center gap-2 sm:gap-3 rounded-2xl border border-[#2a2f45] bg-[#111427]/95 px-2.5 py-1.5 sm:px-3 sm:py-2',
          'shadow-[0_12px_30px_-10px_rgba(0,0,0,0.6)] backdrop-blur supports-[backdrop-filter]:backdrop-blur-md',
          'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95',
        )}
        role="region"
        aria-label="Änderungsleiste"
      >
        <div className="flex items-center gap-2 px-1 sm:pr-1">
          <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-astra-purple shadow-[0_0_8px_rgba(75,70,200,0.6)]" />
          <span className="text-[0.8rem] sm:text-[0.85rem] text-[#c1c7de] whitespace-nowrap">
            {saving ? 'Speichern…' : <><span className="hidden sm:inline">Ungespeicherte Änderungen</span><span className="sm:hidden">Geändert</span></>}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {onCancel && (
            <StyledButton variant="ghost" size="sm" onClick={onCancel} disabled={saving} className="h-9 sm:h-10 text-[0.85rem] sm:text-[0.92rem]">
              {cancelLabel}
            </StyledButton>
          )}
          <StyledButton variant="primary" size="sm" onClick={onSave} loading={saving} className="h-9 sm:h-10 px-4 sm:px-5 text-[0.85rem] sm:text-[0.92rem]">
            {saveLabel}
          </StyledButton>
        </div>
      </div>
    </div>
  );
};

export default SettingsSaveBar;
