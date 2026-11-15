import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TicketMessage, TicketDetail } from '@/types/support';
import MessageBubble from '@/components/support/MessageBubble';
import { Ticket, Wrench, CheckCircle2, RefreshCw, Info, ArrowDown } from 'lucide-react';

interface MessageListProps {
  messages: TicketMessage[];
  currentUserId?: string | null;
  adminView?: boolean;
  ticket?: TicketDetail | null;
  /** Set to true right after the local user sends a message, resets after scroll */
  userJustSent?: boolean;
  onScrolledToBottom?: () => void;
}

function isAtBottom(el: HTMLElement, tolerance = 48) {
  return el.scrollHeight - el.scrollTop - el.clientHeight <= tolerance;
}

/** Systemnachricht – zentrierte Timeline-Card */
const SystemMessage: React.FC<{ message: TicketMessage }> = ({ message }) => {
  const iconMap: Record<string, React.ElementType> = {
    ticket_created: Ticket,
    ticket_resolved: CheckCircle2,
    ticket_reopened: RefreshCw,
    ticket_in_progress: Wrench,
  };
  const Icon = iconMap[message.event_type ?? ''] ?? Info;

  return (
    <div className="flex justify-center my-2">
      <div className="flex flex-wrap items-center justify-center gap-2.5 px-4 py-2 rounded-full border border-[#1e2235] bg-[#0d0f1a]/90 shadow-[0_0_0_1px_rgba(104,97,225,0.04)] text-center">
        <Icon className="w-3.5 h-3.5 text-[#7c78c9] shrink-0" />
        <span className="text-[0.9rem] sm:text-[0.82rem] text-[#8a90ad]">{message.message}</span>
        <span className="block sm:inline text-[0.78rem] sm:text-[0.72rem] text-[#5a6080] sm:ml-1 w-full sm:w-auto">
          {new Date(message.created_at).toLocaleString('de-DE')}
        </span>
      </div>
    </div>
  );
};

/** Eröffnungsbeitrag – hervorgehobene Card */
const OpeningPost: React.FC<{ message: TicketMessage; ticket?: TicketDetail | null }> = ({ message, ticket }) => {
  return (
    <div className="mb-3">
      <div className="rounded-2xl border border-[#5b4cc8]/30 bg-[linear-gradient(135deg,rgba(75,70,200,0.08)_0%,rgba(125,227,255,0.04)_100%)] overflow-hidden shadow-[0_0_0_1px_rgba(104,97,225,0.1)]">
        <div className="px-5 py-3 border-b border-[#5b4cc8]/20 bg-[linear-gradient(180deg,rgba(75,70,200,0.12)_0%,rgba(75,70,200,0)_100%)] flex items-center gap-3">
          <span className="text-lg">📋</span>
          <div className="flex-1 min-w-0">
            <h3 className="text-[#c4b5fd] font-semibold text-[0.95rem]">Ursprüngliche Anfrage</h3>
          </div>
          <span className="text-[0.72rem] text-[#8a90ad]">
            {new Date(message.created_at).toLocaleString('de-DE')}
          </span>
        </div>
        <div className="px-5 py-4">
          {ticket && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3 text-[0.82rem] text-[#9ca2bd]">
              <span className="font-medium text-[#d6dbf0]">{ticket.subject}</span>
              <span>#{ticket.ticket_number}</span>
              <span>{ticket.category}</span>
              <span>{message.author_name}</span>
            </div>
          )}
          <p className="text-[0.95rem] text-[#d6dbf0] whitespace-pre-wrap leading-relaxed break-words">
            {message.message}
          </p>
        </div>
      </div>
    </div>
  );
};

export const MessageList: React.FC<MessageListProps> = ({ messages, currentUserId, adminView, ticket, userJustSent, onScrolledToBottom }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wasAtBottomRef = useRef(true);
  const prevMessageCountRef = useRef(messages.length);
  const [newMsgCount, setNewMsgCount] = useState(0);

  // Track scroll position
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      wasAtBottomRef.current = isAtBottom(el);
      if (wasAtBottomRef.current) {
        setNewMsgCount(0);
        onScrolledToBottom?.();
      }
    };
    el.addEventListener('scroll', onScroll);
    wasAtBottomRef.current = isAtBottom(el);
    return () => el.removeEventListener('scroll', onScroll);
  }, [onScrolledToBottom]);

  const lastMessageKey = useMemo(() => messages.map((m) => m.id).join(','), [messages]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const prevCount = prevMessageCountRef.current;
    const newCount = messages.length;
    const hasNewMessages = newCount > prevCount;
    prevMessageCountRef.current = newCount;

    // User just sent a message → always scroll to bottom
    if (userJustSent) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      setNewMsgCount(0);
      onScrolledToBottom?.();
      return;
    }

    // Already at bottom → auto-scroll
    if (wasAtBottomRef.current) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      return;
    }

    // Not at bottom and new messages arrived → show indicator
    if (hasNewMessages) {
      setNewMsgCount((prev) => prev + (newCount - prevCount));
    }
  }, [lastMessageKey, userJustSent, onScrolledToBottom]);

  const scrollToBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    setNewMsgCount(0);
    onScrolledToBottom?.();
  }, [onScrolledToBottom]);

  return (
    <div className="relative flex-1 min-h-0">
      <div ref={containerRef} className="h-full p-5 space-y-3 overflow-y-auto overscroll-contain scrollbar-hide" data-testid="messages-container">
        {messages.map((m) => {
          // Systemnachricht
          if (m.message_type === 'system') {
            return <SystemMessage key={m.id} message={m} />;
          }

          // Eröffnungsbeitrag
          if (m.event_type === 'ticket_created' && m.message_type === 'user') {
            return <OpeningPost key={m.id} message={m} ticket={ticket} />;
          }

          // Normale Nachricht
          const isOwn = currentUserId ? String(m.author_id) === String(currentUserId) : false;
          const align = isOwn ? 'right' : 'left';
          const highlight = adminView ? m.is_admin : isOwn;
          const badgeText = m.message_type === 'support' || m.is_admin ? 'Astra Support' : undefined;
          const displayName = m.author_name;
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

      {/* New message indicator */}
      {newMsgCount > 0 && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#4b46c8]/40 bg-[#131625]/95 backdrop-blur-sm text-[0.82rem] text-[#c4b5fd] shadow-[0_4px_16px_rgba(0,0,0,0.4)] hover:bg-[#1a1d30] hover:border-[#4b46c8]/60 transition-all duration-200 z-10"
        >
          <span>{newMsgCount === 1 ? 'Neue Nachricht' : `${newMsgCount} neue Nachrichten`}</span>
          <span>·</span>
          <ArrowDown className="w-3.5 h-3.5" />
          <span>Nach unten</span>
        </button>
      )}
    </div>
  );
};

export default MessageList;
