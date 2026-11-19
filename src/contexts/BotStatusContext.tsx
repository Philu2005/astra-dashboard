import React, { createContext, useContext, ReactNode } from 'react';
import { useBotStatus as useBotStatusHook, BotStatus } from '@/hooks/useBotStatus';

const BotStatusContext = createContext<BotStatus>('loading');

export const BotStatusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const status = useBotStatusHook();
  return (
    <BotStatusContext.Provider value={status}>
      {children}
    </BotStatusContext.Provider>
  );
};

export const useBotStatusContext = () => useContext(BotStatusContext);
