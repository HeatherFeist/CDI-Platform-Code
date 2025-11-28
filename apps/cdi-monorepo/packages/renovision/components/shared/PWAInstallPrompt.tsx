import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then((registration) => {
          console.log('✅ Service Worker registered:', registration.scope);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker available
                  if (confirm('New version available! Reload to update?')) {
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
        });
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      console.log('✅ App is running as PWA');
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show install prompt after 30 seconds (don't be annoying)
      setTimeout(() => {
        if (!isInstalled) {
          setShowPrompt(true);
        }
      }, 30000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      console.log('✅ PWA installed successfully');
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // On iOS, show manual instructions
      if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
        alert(
          'To install:\n\n' +
          '1. Tap the Share button (square with arrow)\n' +
          '2. Scroll and tap "Add to Home Screen"\n' +
          '3. Tap "Add" in the top right'
        );
      }
      return;
    }

    // Show install prompt
    deferredPrompt.prompt();

    const choiceResult = await deferredPrompt.userChoice;
    console.log('User choice:', choiceResult.outcome);

    if (choiceResult.outcome === 'accepted') {
      console.log('✅ User accepted install');
    } else {
      console.log('❌ User dismissed install');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    
    // Don't show again for 7 days
    localStorage.setItem('pwa_install_dismissed', Date.now().toString());
  };

  // Don't show if already installed or recently dismissed
  if (isInstalled) return null;
  
  const dismissedTime = localStorage.getItem('pwa_install_dismissed');
  if (dismissedTime && Date.now() - parseInt(dismissedTime) < 7 * 24 * 60 * 60 * 1000) {
    return null;
  }

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-2xl p-6 z-50 animate-slide-up">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-white/80 hover:text-white"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-start gap-4">
        <div className="bg-white/20 p-3 rounded-lg">
          <Smartphone className="w-8 h-8" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-1">
            Install RenovisionPro
          </h3>
          <p className="text-sm text-white/90 mb-4">
            Install our app for faster access, offline support, and push notifications for calls and messages!
          </p>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              <span>Works offline</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              <span>Custom business ringtone</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              <span>No app store needed</span>
            </div>
          </div>

          <button
            onClick={handleInstallClick}
            className="w-full bg-white text-blue-600 font-semibold py-3 px-4 rounded-lg hover:bg-blue-50 transition flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Install Now
          </button>

          <button
            onClick={handleDismiss}
            className="w-full text-sm text-white/80 hover:text-white mt-2"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};

// Hook to request notification permission
export const useNotificationPermission = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.error('This browser does not support notifications');
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  };

  return { permission, requestPermission };
};

// Hook to send push notifications
export const usePushNotifications = () => {
  const sendNotification = async (title: string, options?: NotificationOptions) => {
    if (!('Notification' in window)) {
      console.error('This browser does not support notifications');
      return;
    }

    if (Notification.permission === 'granted') {
      const registration = await navigator.serviceWorker.ready;
      registration.showNotification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-icon.png',
        ...options
      });
    }
  };

  const sendCallNotification = async (callerName: string, callId: string, ringtone: string = '/sounds/business-ringtone.mp3') => {
    await sendNotification('Incoming Call', {
      body: `${callerName} is calling`,
      vibrate: [500, 200, 500, 200, 500],
      requireInteraction: true,
      tag: 'call',
      actions: [
        { action: 'answer', title: 'Answer' },
        { action: 'decline', title: 'Decline' }
      ],
      data: {
        type: 'incoming_call',
        callId,
        callerName,
        ringtone
      }
    });
  };

  return { sendNotification, sendCallNotification };
};
