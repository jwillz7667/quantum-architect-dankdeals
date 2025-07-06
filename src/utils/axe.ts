// src/utils/axe.ts
export const initializeAxe = async () => {
  if (import.meta.env.DEV) {
    try {
      const React = await import('react');
      const ReactDOM = await import('react-dom');
      const axe = await import('@axe-core/react');

      // Initialize axe-core with default configuration
      // Note: color-contrast rule may be noisy during development
      void axe.default(React, ReactDOM, 1000);

      console.log('🔍 Axe accessibility checker is running');
    } catch (error) {
      console.error('Failed to initialize axe-core:', error);
    }
  }
};
