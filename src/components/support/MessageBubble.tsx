import React from 'react';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  authorName: string;
  createdAt: string;
  message: string;
  align: 'left' | 'right';
  highlight?: boolean; // used for admin highlight in admin view
  badgeText?: string; // e.g., "Astra Support" (admin view only)
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
          'max-w-[82%] rounded-2xl border p-3',
          highlight ? 'border-[#5b4cc8]/40 bg-astra-purple/10' : 'border-[#2a2f45] bg-[#0f1220]'
        )}
      >
        <div className="flex items-center justify-between mb-1.5 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className={cn('text-[0.86rem] font-medium truncate', highlight ? 'text-[#c4b5fd]' : 'text-[#d6dbf0]')}>
              {authorName}
            </span>
            {badgeText && (
              <span className="px-1.5 py-0.5 text-[0.7rem] rounded-md border border-astra-purple/30 text-[#c4b5fd]">
                {badgeText}
              </span>
            )}
          </div>
          <span className="text-[0.76rem] text-[#8a90ad] whitespace-nowrap">
            {new Date(createdAt).toLocaleString('de-DE')}
          </span>
        </div>
        <p className="text-[0.95rem] text-[#d6dbf0] whitespace-pre-wrap leading-relaxed break-words">
          {message}
        </p>
      </div>
    </div>
  );
};

export default MessageBubble;
