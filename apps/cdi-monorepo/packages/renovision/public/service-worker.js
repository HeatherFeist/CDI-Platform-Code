// Service Worker for RenovisionPro PWA
// Handles offline caching, push notifications, and background sync

const CACHE_NAME = 'renovisionpro-v1';
const OFFLINE_URL = '/offline.html';

// Files to cache for offline use
const urlsToCache = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/index.css',
  // Add critical assets here
];

// Install event - cache initial files
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll(urlsToCache);
    })
  );
  
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }
      
      // Clone the request
      const fetchRequest = event.request.clone();
      
      return fetch(fetchRequest).then((response) => {
        // Check if valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // Clone the response
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      }).catch(() => {
        // Network failed, return offline page
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }
      });
    })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);
  
  let data = {};
  if (event.data) {
    data = event.data.json();
  }
  
  const title = data.title || 'RenovisionPro';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-icon.png',
    data: data,
    vibrate: data.vibrate || [200, 100, 200],
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || []
  };
  
  // Play custom ringtone for calls
  if (data.type === 'incoming_call') {
    options.vibrate = [500, 200, 500, 200, 500];
    options.requireInteraction = true;
    options.tag = 'call';
    options.actions = [
      { action: 'answer', title: 'Answer', icon: '/icons/answer-icon.png' },
      { action: 'decline', title: 'Decline', icon: '/icons/decline-icon.png' }
    ];
    
    // Play ringtone
    const ringtone = data.ringtone || '/sounds/business-ringtone.mp3';
    playRingtone(ringtone);
  }
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event);
  
  event.notification.close();
  
  const data = event.notification.data || {};
  let url = data.url || '/';
  
  // Handle call actions
  if (event.action === 'answer' && data.type === 'incoming_call') {
    url = `/call/${data.callId}`;
    stopRingtone();
  } else if (event.action === 'decline' && data.type === 'incoming_call') {
    stopRingtone();
    // Send decline notification to backend
    fetch(`/api/calls/${data.callId}/decline`, { method: 'POST' });
    return;
  }
  
  // Open the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Background sync event (for offline actions)
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  } else if (event.tag === 'sync-transactions') {
    event.waitUntil(syncTransactions());
  }
});

// Helper functions

let ringtoneAudio = null;

function playRingtone(url) {
  if (ringtoneAudio) {
    ringtoneAudio.pause();
  }
  
  ringtoneAudio = new Audio(url);
  ringtoneAudio.loop = true;
  ringtoneAudio.play().catch(err => {
    console.error('[Service Worker] Failed to play ringtone:', err);
  });
}

function stopRingtone() {
  if (ringtoneAudio) {
    ringtoneAudio.pause();
    ringtoneAudio = null;
  }
}

async function syncMessages() {
  // Get pending messages from IndexedDB
  // Send to server
  // Update local state
  console.log('[Service Worker] Syncing messages...');
}

async function syncTransactions() {
  // Get pending transactions from IndexedDB
  // Send to server
  // Update local state
  console.log('[Service Worker] Syncing transactions...');
}

// Message event (communication with main app)
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'STOP_RINGTONE') {
    stopRingtone();
  }
});
