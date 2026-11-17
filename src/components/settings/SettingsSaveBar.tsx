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
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-[#2d3246] bg-[linear-gradient(180deg,#111428_0%,#0f1220_100%)]/95 backdrop-blur-xl supports-[backdrop-filter]:bg-opacity-85',
        'shadow-[0_-10px_30px_rgba(0,0,0,0.45),0_-1px_0_rgba(75,70,200,0.15)]',
        className,
      )}
      {...props}
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-astra-purple shadow-[0_0_8px_rgba(75,70,200,0.6)]" />
          <span className="text-[0.95rem] text-[#c1c7de]">
            {saving ? 'Speichern läuft…' : 'Es gibt ungespeicherte Änderungen'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <StyledButton variant="ghost" onClick={onCancel} disabled={saving}>
            {cancelLabel}
          </StyledButton>
          <StyledButton variant="primary" onClick={onSave} loading={saving}>
            {saveLabel}
          </StyledButton>
        </div>
      </div>
    </div>
  );
};

export default SettingsSaveBar;
