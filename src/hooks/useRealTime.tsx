import React from 'react';
import { RealTimeContext } from '@/context/RealTimeContext-utils';

export const useRealTime = () => {
  const context = React.useContext(RealTimeContext);
  if (!context) {
    throw new Error('useRealTime must be used within a RealTimeProvider');
  }
  return context;
};
