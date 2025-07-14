import React from 'react';
import { RealTimeContext } from '@/context/RealTimeContext';

export const useRealTime = () => {
  const context = React.useContext(RealTimeContext);
  if (!context) {
    throw new Error('useRealTime must be used within a RealTimeProvider');
  }
  return context;
};
