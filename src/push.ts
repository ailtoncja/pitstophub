import { supabase } from './supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window &&
    Boolean(VAPID_PUBLIC_KEY)
  );
}

export function isIosPwaRequired(): boolean {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false;
  const isIOS =
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!isIOS) return false;
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as unknown as { standalone: boolean }).standalone === true);
  return !standalone;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<null>((resolve) => {
        window.setTimeout(() => resolve(null), 4000);
      }),
    ]);
  } catch {
    return null;
  }
}

export async function getExistingPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  try {
    const registration = await getRegistration();
    if (!registration) return null;
    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}

export async function subscribeToPush(userId: string): Promise<{ ok: boolean; reason?: 'unsupported' | 'denied' | 'error' }> {
  if (!isPushSupported() || !supabase) return { ok: false, reason: 'unsupported' };
  if (isIosPwaRequired()) return { ok: false, reason: 'unsupported' };

  if (Notification.permission === 'denied') return { ok: false, reason: 'denied' };

  const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (permission !== 'granted') return { ok: false, reason: 'denied' };

  try {
    const registration = await getRegistration();
    if (!registration) return { ok: false, reason: 'error' };

    const existing = await registration.pushManager.getSubscription();
    const subscription = existing ?? await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!),
    });

    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return { ok: false, reason: 'error' };

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      },
      { onConflict: 'endpoint' }
    );
    if (error) throw error;

    return { ok: true };
  } catch (error) {
    console.error('Falha ao ativar notificacoes.', error);
    return { ok: false, reason: 'error' };
  }
}

export async function ensurePushSubscription(userId: string): Promise<boolean> {
  if (!isPushSupported() || Notification.permission !== 'granted') return false;
  const result = await subscribeToPush(userId);
  return result.ok;
}

export async function sendTestNotification(language: 'pt' | 'en'): Promise<boolean> {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return false;
  const title = language === 'en' ? 'PitStopHub is ready' : 'PitStopHub está pronto';
  const body = language === 'en'
    ? 'You will get a ping on race day, an hour before the start, and when results land.'
    : 'Você vai receber um aviso no dia da corrida, 1 hora antes da largada e quando sair o resultado.';
  const options = {
    body,
    icon: '/icons/icon-192.png',
    tag: 'pitstophub-test',
    vibrate: [200, 100, 200],
  };

  try {
    const registration = await getRegistration();
    if (registration) {
      await registration.showNotification(title, options);
      return true;
    }
    new Notification(title, { body, icon: '/icons/icon-192.png', tag: 'pitstophub-test' });
    return true;
  } catch (error) {
    console.error('Falha ao enviar notificacao de teste.', error);
    return false;
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!isPushSupported() || !supabase) return;
  try {
    const registration = await getRegistration();
    if (!registration) return;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;
    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();
    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
  } catch (error) {
    console.error('Falha ao desativar notificacoes.', error);
  }
}
