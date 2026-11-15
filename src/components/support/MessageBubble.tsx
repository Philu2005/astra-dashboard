import React from 'react';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  authorName: string;
  createdAt: string;
  message: string;
  align: 'left' | 'right';
  highlight?: boolean;
  badgeText?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  authorName,
  createdAt,
  message,
  align,
  highlight,
  badgeText,
}) => {
  return (
    <div className={cn('flex', align === 'right' ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          // Auf sehr kleinen Screens etwas breiter, um nutzbare Fläche zu erhöhen
          'max-w-[88%] sm:max-w-[82%] rounded-2xl border p-3',
          highlight ? 'border-[#5b4cc8]/40 bg-astra-purple/10' : 'border-[#2a2f45] bg-[#0f1220]'
        )}
      >
        <div className="flex flex-wrap items-center justify-between mb-1.5 gap-2 sm:gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {/* Autor auf Mobile nicht abschneiden, stattdessen umbrechen; ab sm ggf. truncaten */}
            <span className={cn('text-[0.9rem] sm:text-[0.86rem] font-medium break-words sm:truncate', highlight ? 'text-[#c4b5fd]' : 'text-[#d6dbf0]')}>
              {authorName}
            </span>
            {badgeText && (
              <span className="px-1.5 py-0.5 text-[0.7rem] rounded-md border border-astra-purple/30 text-[#c4b5fd] shrink-0">
                {badgeText}
              </span>
            )}
          </div>
          {/* Zeitstempel: auf Mobile unter den Header umbrechen */}
          <span className="text-[0.78rem] sm:text-[0.76rem] text-[#8a90ad] whitespace-normal sm:whitespace-nowrap order-3 sm:order-none basis-full sm:basis-auto mt-0.5 sm:mt-0">
            {new Date(createdAt).toLocaleString('de-DE')}
          </span>
        </div>
        {/* Nachricht: angenehme Lesbarkeit, korrekt umbrechen ohne aggressives break-all */}
        <p className="text-[0.95rem] sm:text-[0.95rem] text-[#d6dbf0] whitespace-pre-wrap leading-relaxed break-words">
          {message}
        </p>
      </div>
    </div>
  );
};

export default MessageBubble;
