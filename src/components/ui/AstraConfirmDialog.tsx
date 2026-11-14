import React from 'react';
import { cn } from '@/lib/utils';

export interface AstraConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  warning?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const AstraConfirmDialog: React.FC<AstraConfirmDialogProps> = ({
  open,
  title,
  description,
  warning,
  confirmLabel = 'Bestätigen',
  cancelLabel = 'Abbrechen',
  icon,
  loading = false,
  error = null,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => !loading && onCancel()} />
      <div className="relative z-10 w-[92%] max-w-md rounded-2xl border border-[#2a2f45] bg-[#131625] shadow-xl animate-[fade-in_120ms_ease-out]">
        <div className="p-5">
          <div className="flex items-start gap-3">
            {icon ?? (
              <div className="mt-0.5 h-8 w-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-300">
                {/* simple trash icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 6h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M8 6V4.5A1.5 1.5 0 0 1 9.5 3h5A1.5 1.5 0 0 1 16 4.5V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M10 10v8M14 10v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-white font-semibold text-lg leading-tight truncate">{title}</h3>
              {description && <p className="mt-1 text-[#9ca2bd] text-[0.92rem]">{description}</p>}
              {warning && (
                <div className="mt-3 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-300 text-[0.9rem] px-3 py-2">
                  {warning}
                </div>
              )}
              {error && (
                <div className="mt-3 text-rose-400 text-[0.9rem]">{error}</div>
              )}
            </div>
          </div>
          <div className="mt-5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 font-semibold transition-all duration-200',
                loading ? 'bg-[#171a2b] border-[#2a2f45] text-[#8a90ad]' : 'bg-[#171a2b] border-[#2a2f45] text-[#d6dbf0] hover:translate-y-[-1px]'
              )}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 font-semibold transition-all duration-200',
                loading ? 'bg-rose-500/10 border-rose-500/40 text-rose-300 cursor-wait' : 'bg-rose-500/15 border-rose-500/40 text-rose-300 hover:translate-y-[-1px]'
              )}
            >
              {loading ? 'Lösche…' : (confirmLabel || 'Endgültig löschen')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AstraConfirmDialog;
