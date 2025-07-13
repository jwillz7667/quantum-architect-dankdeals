// src/hooks/useRealTime.tsx
import { useContext } from 'react';
import { RealTimeContext } from '@/context/RealTimeContext';

export function useRealTime() {
  const context = useContext(RealTimeContext);
  if (context === undefined) {
    throw new Error('useRealTime must be used within a RealTimeProvider');
  }
  return context;
} 