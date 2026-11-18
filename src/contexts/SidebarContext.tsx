import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

type SidebarContextValue = {
  isOpen: boolean;
  isDesktop: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(min-width: 1024px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      // @ts-expect-error support both types
      setIsDesktop(!!(e.matches ?? e.currentTarget?.matches));
    };
    // Initial sync and subscribe
    handler(mq as any);
    mq.addEventListener?.('change', handler as any);
    // Fallback for older browsers
    // @ts-ignore
    mq.addListener?.(handler);
    return () => {
      mq.removeEventListener?.('change', handler as any);
      // @ts-ignore
      mq.removeListener?.(handler);
    };
  }, []);

  return isDesktop;
}

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isDesktop = useIsDesktop();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const location = useLocation();
  const mounted = useRef(false);

  // Close on route change for mobile
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (!isDesktop) setIsOpen(false);
  }, [location.pathname, isDesktop]);

  // Close on ESC for mobile
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDesktop) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isDesktop]);

  // Auto close when switching to desktop (overlay no longer needed)
  useEffect(() => {
    if (isDesktop && isOpen) setIsOpen(false);
  }, [isDesktop]);

  const value = useMemo<SidebarContextValue>(() => ({
    isOpen,
    isDesktop,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((v) => !v),
  }), [isOpen, isDesktop]);

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
};

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
}
