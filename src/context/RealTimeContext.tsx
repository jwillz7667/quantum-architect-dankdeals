// src/context/RealTimeContext.tsx
import React, { createContext, type ReactNode } from 'react';

// Simplified RealTime context - no real-time features for guest checkout
interface RealTimeContextType {
  connected: boolean;
  orders: never[];
}

export const RealTimeContext = createContext<RealTimeContextType | null>(null);

export const RealTimeProvider = ({ children }: { children: ReactNode }) => {
  const value: RealTimeContextType = {
    connected: false,
    orders: [],
  };

  return <RealTimeContext.Provider value={value}>{children}</RealTimeContext.Provider>;
};
