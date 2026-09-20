import { useEffect, useState } from 'react';

let globalDeferredPrompt = null;
const listeners = new Set();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    globalDeferredPrompt = e;
    listeners.forEach((listener) => listener(globalDeferredPrompt));
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    listeners.forEach((listener) => listener(null));
  });
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(globalDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if running in standalone PWA mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsInstalled(isStandalone);

    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const updatePrompt = (prompt) => {
      setDeferredPrompt(prompt);
      if (!prompt && isStandalone) {
        setIsInstalled(true);
      }
    };

    listeners.add(updatePrompt);
    return () => {
      listeners.delete(updatePrompt);
    };
  }, []);

  const install = async () => {
    const prompt = deferredPrompt || globalDeferredPrompt;
    if (!prompt) return false;
    prompt.prompt();
    try {
      const choice = await prompt.userChoice;
      if (choice && choice.outcome === 'accepted') {
        setIsInstalled(true);
        globalDeferredPrompt = null;
        setDeferredPrompt(null);
        listeners.forEach((l) => l(null));
        return true;
      }
    } catch (err) {
      console.warn('PWA install prompt error:', err);
    }
    return false;
  };

  return {
    isInstallable: !!(deferredPrompt || globalDeferredPrompt),
    isInstalled,
    isIOS,
    install,
    deferredPrompt: deferredPrompt || globalDeferredPrompt
  };
}

/* JGFMusic v1.0.2 */
