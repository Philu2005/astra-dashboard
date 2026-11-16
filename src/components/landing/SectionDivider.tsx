import { memo } from 'react';
import { cn } from '@/lib/utils';

type SectionDividerProps = {
  className?: string;
  flip?: boolean;
};

export const SectionDivider = memo(({ className, flip = false }: SectionDividerProps) => {
  return (
    <div className={cn('relative w-full h-16 overflow-hidden select-none', className)} aria-hidden>
      <svg
        className={cn('absolute inset-0 w-full h-full', flip && 'rotate-180')}
        viewBox="0 0 1440 160"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="astraDivide" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#4b46c8" stopOpacity="0.0" />
            <stop offset="45%" stopColor="#a855f7" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#7de3ff" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d="M0,96 C260,56 480,120 720,96 C960,72 1180,8 1440,48 L1440,160 L0,160 Z" fill="url(#astraDivide)" />
        <path d="M0,116 C260,76 480,140 720,116 C960,92 1180,28 1440,68 L1440,160 L0,160 Z" fill="#0b0f1f" fillOpacity="0.55" />
      </svg>
    </div>
  );
});

export default SectionDivider;
