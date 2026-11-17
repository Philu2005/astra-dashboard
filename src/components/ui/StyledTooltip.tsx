import React from 'react';
import { cn } from '@/lib/utils';

export interface StyledTooltipProps {
  content: React.ReactNode;
  children: React.ReactElement<any>;
  side?: 'top' | 'right' | 'bottom' | 'left';
  delay?: number;
  className?: string;
}

// Einfache, zugängliche Tooltip-Implementierung ohne externe Abhängigkeiten
export const StyledTooltip: React.FC<StyledTooltipProps> = ({ content, children, side = 'top', delay = 150, className }) => {
  const [open, setOpen] = React.useState(false);
  const [timer, setTimer] = React.useState<number | null>(null);
  const ref = React.useRef<HTMLDivElement | null>(null);

  const show = () => {
    if (timer) window.clearTimeout(timer);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setOpen(true);
      return;
    }
    const id = window.setTimeout(() => setOpen(true), delay);
    setTimer(id);
  };
  const hide = () => {
    if (timer) window.clearTimeout(timer);
    setTimer(null);
    setOpen(false);
  };

  const child = React.cloneElement(children as React.ReactElement<any>, {
    onMouseEnter: (e: any) => {
      (children as any).props?.onMouseEnter?.(e);
      show();
    },
    onMouseLeave: (e: any) => {
      (children as any).props?.onMouseLeave?.(e);
      hide();
    },
    onFocus: (e: any) => {
      (children as any).props?.onFocus?.(e);
      show();
    },
    onBlur: (e: any) => {
      (children as any).props?.onBlur?.(e);
      hide();
    },
    'aria-describedby': open ? 'astra-tooltip' : undefined,
  } as any);

  const pos =
    side === 'top'
      ? 'bottom-full left-1/2 -translate-x-1/2 -translate-y-1 mt-1'
      : side === 'bottom'
        ? 'top-full left-1/2 -translate-x-1/2 translate-y-1 mt-1'
        : side === 'left'
          ? 'right-full top-1/2 -translate-y-1/2 -translate-x-1 mr-1'
          : 'left-full top-1/2 -translate-y-1/2 translate-x-1 ml-1';

  return (
    <div ref={ref} className="relative inline-flex">
      {child}
      <div
        id="astra-tooltip"
        role="tooltip"
        className={cn(
          'pointer-events-none absolute z-50 rounded-md border px-2 py-1 text-[0.82rem] text-[#dbe3ff]',
          'bg-[#121524] border-[#333a55] shadow-astra',
          'transition-all duration-150 motion-reduce:transition-none',
          open ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
          pos,
          className,
        )}
      >
        {content}
      </div>
    </div>
  );
};

export default StyledTooltip;
