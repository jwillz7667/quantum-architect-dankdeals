// src/context/RealTimeContext.tsx
import type { ReactNode } from 'react';
import { RealTimeContext } from './RealTimeContext-utils';

export const RealTimeProvider = ({ children }: { children: ReactNode }) => {
  const value = {
    connected: false,
    orders: [] as never[],
  };

  return <RealTimeContext.Provider value={value}>{children}</RealTimeContext.Provider>;
};
