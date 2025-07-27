import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X, Smartphone, Monitor } from '@/lib/icons';
import { showPWAInstallPrompt, isPWA, isPWAInstallAvailable } from '@/lib/pwa';

interface PWAInstallButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function PWAInstallButton({
  variant = 'default',
  size = 'default',
  className,
}: PWAInstallButtonProps) {
  const [isInstallAvailable, setIsInstallAvailable] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Don't show if already running as PWA
    if (isPWA()) {
      return;
    }

    // Check initial state
    setIsInstallAvailable(isPWAInstallAvailable());

    // Listen for install prompt availability
    const handleInstallAvailable = () => {
      setIsInstallAvailable(true);
      setShowBanner(true);
    };

    const handleInstallHidden = () => {
      setIsInstallAvailable(false);
      setShowBanner(false);
    };

    window.addEventListener('pwa-install-available', handleInstallAvailable);
    window.addEventListener('pwa-install-hidden', handleInstallHidden);

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
      window.removeEventListener('pwa-install-hidden', handleInstallHidden);
    };
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const success = await showPWAInstallPrompt();
      if (success) {
        setIsInstallAvailable(false);
        setShowBanner(false);
      }
    } catch (error) {
      console.error('Install failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const dismissBanner = () => {
    setShowBanner(false);
    // Remember user dismissed for this session
    sessionStorage.setItem('pwa-banner-dismissed', 'true');
  };

  // Don't render if not available or already PWA
  if (!isInstallAvailable || isPWA()) {
    return null;
  }

  // Show as banner at top of page
  if (showBanner && !sessionStorage.getItem('pwa-banner-dismissed')) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground p-4 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-sm">Install DankDeals App</div>
              <div className="text-xs opacity-90 hidden sm:block">
                Get faster access and offline browsing
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void handleInstall()}
              disabled={isInstalling}
              className="text-primary bg-white hover:bg-gray-100"
            >
              {isInstalling ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
                  Installing...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Install
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={dismissBanner}
              className="text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Regular button component
  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => void handleInstall()}
      disabled={isInstalling}
      className={className}
    >
      {isInstalling ? (
        <>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
          Installing...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          Install App
        </>
      )}
    </Button>
  );
}

// PWA status indicator for debugging
export function PWAStatusIndicator() {
  const [isRunningAsPWA, setIsRunningAsPWA] = useState(false);
  const [isInstallAvailable, setIsInstallAvailable] = useState(false);

  useEffect(() => {
    setIsRunningAsPWA(isPWA());
    setIsInstallAvailable(isPWAInstallAvailable());

    const handleInstallAvailable = () => setIsInstallAvailable(true);
    const handleInstallHidden = () => setIsInstallAvailable(false);

    window.addEventListener('pwa-install-available', handleInstallAvailable);
    window.addEventListener('pwa-install-hidden', handleInstallHidden);

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
      window.removeEventListener('pwa-install-hidden', handleInstallHidden);
    };
  }, []);

  // Only show in development
  if (process.env['NODE_ENV'] !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-black text-white p-2 rounded text-xs font-mono">
      <div className="flex items-center space-x-2">
        {isRunningAsPWA ? (
          <>
            <Monitor className="h-3 w-3 text-green-400" />
            <span>PWA Mode</span>
          </>
        ) : (
          <>
            <Smartphone className="h-3 w-3 text-blue-400" />
            <span>Browser Mode</span>
          </>
        )}
      </div>
      {isInstallAvailable && <div className="text-yellow-400 mt-1">Install Available</div>}
    </div>
  );
}
