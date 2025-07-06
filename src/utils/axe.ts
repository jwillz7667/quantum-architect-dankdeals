// src/utils/axe.ts
export const initializeAxe = async () => {
  if (import.meta.env.DEV) {
    try {
      const React = await import('react');
      const ReactDOM = await import('react-dom');
      const axe = await import('@axe-core/react');
      
      axe.default(React, ReactDOM, 1000, {
        rules: {
          // Disable rules that might be too noisy in development
          'color-contrast': { enabled: false }, // Can be re-enabled when design is final
        },
      });
      
      console.log('🔍 Axe accessibility checker is running');
    } catch (error) {
      console.error('Failed to initialize axe-core:', error);
    }
  }
}; 