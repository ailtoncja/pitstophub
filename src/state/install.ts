import { useCallback, useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const IOS_DISMISSED_KEY = 'pitstophub_ios_install_dismissed';

function isIosNotInstalled(): boolean {
  if (typeof navigator === 'undefined') return false;
  const isIOS =
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!isIOS) return false;
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as unknown as { standalone: boolean }).standalone === true);
  return !standalone;
}

/** Instalacao do PWA: prompt nativo (Android/Chrome) e instrucao manual no iOS. */
export function useInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);
  const [iosHint, setIosHint] = useState(() => {
    try {
      return isIosNotInstalled() && localStorage.getItem(IOS_DISMISSED_KEY) !== '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      setInstalling(false);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    setInstalling(true);
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } catch (error) {
      console.error('Falha ao iniciar a instalacao do app.', error);
    } finally {
      setDeferred(null);
      setInstalling(false);
    }
  }, [deferred]);

  const dismissIosHint = useCallback(() => {
    try {
      localStorage.setItem(IOS_DISMISSED_KEY, '1');
    } catch {
      // so nao persiste
    }
    setIosHint(false);
  }, []);

  return { canInstall: deferred != null, installing, install, iosHint, dismissIosHint };
}
