import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClientProvider } from '@tanstack/react-query';
import { Routes, Route } from 'react-router-dom';
import { Suspense } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AgeGate } from '@/components/AgeGate';
import { SEOProvider } from '@/components/SEOEnhanced';
import { AuthProvider } from '@/context/AuthContext';
import { MobileMenuProvider } from '@/context/MobileMenuContext';
import { GTMProvider } from '@/components/analytics/GTMProvider';

import { lazyWithPrefetch } from '@/lib/lazyWithPrefetch';
import { queryClient } from '@/lib/react-query/config';

const ComingSoon = lazyWithPrefetch(() => import('./pages/ComingSoon'));

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SEOProvider>
            <GTMProvider>
              <TooltipProvider>
                <MobileMenuProvider>
                  <AgeGate />
                  <Toaster />
                  <Sonner />
                  <Suspense fallback={null}>
                    <Routes>
                      <Route path="/" element={<ComingSoon />} />
                      <Route path="/coming-soon" element={<ComingSoon />} />
                      <Route path="*" element={<ComingSoon />} />
                    </Routes>
                  </Suspense>
                </MobileMenuProvider>
              </TooltipProvider>
            </GTMProvider>
          </SEOProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
