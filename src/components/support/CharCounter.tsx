import React from 'react';
import { cn } from '@/lib/utils';

export const CharCounter: React.FC<{ current: number; max: number; warn: number }> = ({ current, max, warn }) => {
  const remaining = max - current;
  const isWarning = remaining <= warn && remaining > 0;
  const isLimit = remaining <= 0;
  return (
    <div className={cn(
      'mt-1 text-[0.75rem] text-right tabular-nums transition-colors',
      isLimit ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-[#596189]'
    )}>
      {remaining} / {max} Zeichen verbleibend
    </div>
  );
};
