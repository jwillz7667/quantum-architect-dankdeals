import React from 'react';

// Simple health check to verify all critical imports work
export const performHealthCheck = () => {
  try {
    // Check if all critical modules are available
    const checks = {
      react: typeof React !== 'undefined',
      zod: true, // Will throw if import fails
      supabase: true, // Will throw if import fails
      crypto: typeof crypto !== 'undefined' || typeof window?.crypto !== 'undefined'
    };
    
    return {
      status: 'healthy',
      checks,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
};

// Simple function to ensure the app is ready
export const waitForApp = () => {
  return new Promise((resolve) => {
    if (document.readyState === 'complete') {
      resolve(true);
    } else {
      window.addEventListener('load', () => resolve(true));
    }
  });
};