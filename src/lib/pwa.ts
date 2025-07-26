// PWA utilities for DankDeals
export interface PWAInstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let deferredPrompt: PWAInstallPrompt | null = null;

// Service Worker registration
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none', // Always check for updates
    });

    console.log('Service Worker registered successfully:', registration);

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available
            void showUpdateAvailableNotification();
          }
        });
      }
    });

    // Listen for controlling service worker changes
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // Reload the page when new service worker takes control
      window.location.reload();
    });

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

// PWA install prompt handling
export function setupPWAInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('PWA install prompt available');
    e.preventDefault();
    deferredPrompt = e as PWAInstallPrompt;

    // Show custom install button
    showInstallButton();
  });

  // Track successful installations
  window.addEventListener('appinstalled', () => {
    console.log('PWA installed successfully');
    deferredPrompt = null;
    hideInstallButton();

    // Track installation event
    trackPWAInstall();
  });
}

// Show PWA install prompt
export async function showPWAInstallPrompt(): Promise<boolean> {
  if (!deferredPrompt) {
    console.log('PWA install prompt not available');
    return false;
  }

  try {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    console.log('PWA install prompt result:', outcome);
    deferredPrompt = null;

    if (outcome === 'accepted') {
      hideInstallButton();
      return true;
    }

    return false;
  } catch (error) {
    console.error('PWA install prompt failed:', error);
    return false;
  }
}

// Check if app is running as PWA
export function isPWA(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  ); // iOS Safari
}

// Check if PWA install is available
export function isPWAInstallAvailable(): boolean {
  return deferredPrompt !== null;
}

// Show custom install button
function showInstallButton(): void {
  const installButton = document.getElementById('pwa-install-button');
  if (installButton) {
    installButton.style.display = 'block';
  }

  // Custom event for React components to listen to
  window.dispatchEvent(new CustomEvent('pwa-install-available'));
}

// Hide custom install button
function hideInstallButton(): void {
  const installButton = document.getElementById('pwa-install-button');
  if (installButton) {
    installButton.style.display = 'none';
  }

  // Custom event for React components to listen to
  window.dispatchEvent(new CustomEvent('pwa-install-hidden'));
}

// Show update available notification
function showUpdateAvailableNotification(): void {
  // Create a custom notification or use your toast system
  const notification = document.createElement('div');
  notification.id = 'pwa-update-notification';
  notification.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: #185a1b;
      color: white;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      max-width: 300px;
    ">
      <div style="font-weight: 600; margin-bottom: 8px;">App Update Available</div>
      <div style="font-size: 14px; margin-bottom: 12px;">A new version of DankDeals is available.</div>
      <button id="pwa-update-button" style="
        background: white;
        color: #185a1b;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        font-weight: 600;
        cursor: pointer;
        margin-right: 8px;
      ">Update Now</button>
      <button id="pwa-dismiss-button" style="
        background: transparent;
        color: white;
        border: 1px solid white;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
      ">Later</button>
    </div>
  `;

  document.body.appendChild(notification);

  // Handle update button click
  document.getElementById('pwa-update-button')?.addEventListener('click', () => {
    void updateServiceWorker();
    notification.remove();
  });

  // Handle dismiss button click
  document.getElementById('pwa-dismiss-button')?.addEventListener('click', () => {
    notification.remove();
  });

  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 10000);
}

// Update service worker
async function updateServiceWorker(): Promise<void> {
  const registration = await navigator.serviceWorker.getRegistration();
  if (registration && registration.waiting) {
    // Tell the waiting service worker to skip waiting
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
}

// Track PWA installation (integrate with your analytics)
function trackPWAInstall(): void {
  // Track with your analytics service
  if (typeof (window as { gtag?: (...args: unknown[]) => void }).gtag === 'function') {
    (window as { gtag: (...args: unknown[]) => void }).gtag('event', 'pwa_install', {
      event_category: 'engagement',
      event_label: 'DankDeals PWA Installed',
    });
  }

  // Track with Plausible or your analytics
  if (typeof (window as { plausible?: (event: string) => void }).plausible === 'function') {
    (window as { plausible: (event: string) => void }).plausible('PWA Install');
  }

  console.log('PWA installation tracked');
}

// Background sync utilities
export async function scheduleBackgroundSync(tag: string, data?: unknown): Promise<void> {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as { sync: { register: (tag: string) => Promise<void> } }).sync.register(
        tag
      );

      // Store data in IndexedDB for the service worker to use
      if (data) {
        storeBackgroundSyncData(tag, data);
      }

      console.log('Background sync scheduled:', tag);
    } catch (error) {
      console.error('Background sync registration failed:', error);
    }
  }
}

// Store data for background sync (simplified implementation)
function storeBackgroundSyncData(tag: string, data: unknown): void {
  // In a real implementation, you'd use IndexedDB
  localStorage.setItem(
    `bg-sync-${tag}`,
    JSON.stringify({
      tag,
      data,
      timestamp: Date.now(),
    } as { tag: string; data: unknown; timestamp: number })
  );
}

// Push notification utilities
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  console.log('Notification permission:', permission);
  return permission;
}

// Subscribe to push notifications
export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  try {
    const registration = await navigator.serviceWorker.ready;

    // Check if already subscribed
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      return existingSubscription;
    }

    // Request permission first
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      return null;
    }

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        // Your VAPID public key would go here
        'YOUR_VAPID_PUBLIC_KEY'
      ),
    });

    console.log('Push subscription created:', subscription);

    // Send subscription to your server
    await sendSubscriptionToServer(subscription);

    return subscription;
  } catch (error) {
    console.error('Push subscription failed:', error);
    return null;
  }
}

// Convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Send subscription to server
async function sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
  try {
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });
  } catch (error) {
    console.error('Failed to send subscription to server:', error);
  }
}

// Initialize PWA features
export async function initializePWA(): Promise<void> {
  console.log('Initializing PWA features...');

  // Register service worker
  await registerServiceWorker();

  // Setup install prompt
  setupPWAInstallPrompt();

  // Log PWA status
  console.log('PWA running:', isPWA());
  console.log('PWA install available:', isPWAInstallAvailable());
}
