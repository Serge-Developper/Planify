import { secureApiCall } from '@/api';

export function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push messaging is not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // 1. Get Public Key from Backend
    // Note: routes are mounted under /users in backend
    const res: any = await secureApiCall('/users/push/public-key');
    if (!res || res.enabled === false) {
      console.info('Push notifications disabled');
      return false;
    }
    if (!res.publicKey) {
      console.warn('No VAPID public key set');
      return false;
    }

    const convertedVapidKey = urlBase64ToUint8Array(res.publicKey);

    // 2. Subscribe
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey
    });

    // 3. Send Subscription to Backend
    const subRes: any = await secureApiCall('/users/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({ subscription })
    });

    return subRes && subRes.success;
  } catch (error) {
    console.error('Failed to subscribe to push notifications', error);
    return false;
  }
}