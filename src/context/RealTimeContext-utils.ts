import { createContext } from 'react';

// Simplified RealTime context - no real-time features for guest checkout
interface RealTimeContextType {
  connected: boolean;
  orders: never[];
}

export const RealTimeContext = createContext<RealTimeContextType | null>(null);
