import React from 'react';
import { cn } from '@/lib/utils';

export interface StyledTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  hint?: string;
  resizable?: boolean;
}

export const StyledTextarea = React.forwardRef<HTMLTextAreaElement, StyledTextareaProps>(
  ({ className, error, hint, resizable = true, disabled, ...props }, ref) => {
    return (
      <div className={cn('relative', disabled && 'opacity-60')}>
        <textarea
          ref={ref}
          disabled={disabled}
          className={cn(
            'min-h-[90px] w-full rounded-md border bg-[#0f1220] p-3 text-[0.95rem] text-white',
            'border-[#2a2f45] placeholder:text-[#7f86a8]',
            'focus:outline-none focus:border-astra-purple/40 focus:ring-0',
            'hover:border-astra-purple/25',
            !resizable && 'resize-none',
            'transition-colors duration-150 motion-reduce:transition-none',
            error && 'border-red-500/60 focus:border-red-400',
            className,
          )}
          {...props}
        />
        {(hint || error) && (
          <div className="mt-1 text-[0.82rem]">
            {error ? (
              <span role="alert" className="text-red-400">{error}</span>
            ) : (
              <span className="text-[#8fa1c6]">{hint}</span>
            )}
          </div>
        )}
      </div>
    );
  },
);

StyledTextarea.displayName = 'StyledTextarea';

export default StyledTextarea;
