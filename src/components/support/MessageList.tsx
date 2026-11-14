import React, { useEffect, useMemo, useRef } from 'react';
import type { TicketMessage } from '@/types/support';
import MessageBubble from '@/components/support/MessageBubble';

interface MessageListProps {
  messages: TicketMessage[];
  currentUserId?: string | null;
  adminView?: boolean; // if true, show admin highlight/badge for is_admin messages
}

// Helper to determine if scrolled to bottom (with tolerance)
function isAtBottom(el: HTMLElement, tolerance = 24) {
  return el.scrollHeight - el.scrollTop - el.clientHeight <= tolerance;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, currentUserId, adminView }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wasAtBottomRef = useRef(true);

  // Track whether user is at bottom before updates
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      wasAtBottomRef.current = isAtBottom(el);
    };
    el.addEventListener('scroll', onScroll);
    // initialize
    wasAtBottomRef.current = isAtBottom(el);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Auto-scroll on new messages if previously at bottom
  const lastMessageKey = useMemo(() => messages.map((m) => m.id).join(','), [messages]);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (wasAtBottomRef.current) {
      // smooth scroll to bottom
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [lastMessageKey]);

  return (
    <div ref={containerRef} className="flex-1 min-h-0 p-5 space-y-3 overflow-y-auto scrollbar-hide">
      {messages.map((m) => {
        const isOwn = currentUserId ? String(m.author_id) === String(currentUserId) : false;
        const align = isOwn ? 'right' : 'left';
        const highlight = adminView ? m.is_admin : isOwn; // in user view: own msgs may appear slightly emphasized via theme of bubble
        const badgeText = adminView && m.is_admin ? 'Astra Support' : undefined;
        const displayName = adminView ? m.author_name : (m.is_admin ? 'Support' : m.author_name);
        return (
          <MessageBubble
            key={m.id}
            authorName={displayName}
            createdAt={m.created_at}
            message={m.message}
            align={align as 'left' | 'right'}
            highlight={!!highlight}
            badgeText={badgeText}
          />
        );
      })}
    </div>
  );
};

export default MessageList;
