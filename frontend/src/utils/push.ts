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
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    const res: any = await secureApiCall('/users/push/public-key');
    if (!res || res.enabled === false) {
      return false;
    }
    if (!res.publicKey) {
      return false;
    }

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      const convertedVapidKey = urlBase64ToUint8Array(res.publicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });
    }

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
