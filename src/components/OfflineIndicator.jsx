import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (showReconnected) {
    return (
      <div className="fixed top-18 right-4 z-40 flex items-center gap-2 rounded-xl bg-emerald-600 text-white px-3 py-1.5 text-xs font-black uppercase max-border shadow-lg animate-bounce">
        <Wifi size={14} className="stroke-[3]" />
        <span>BACK ONLINE</span>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="fixed top-18 right-4 z-40 flex items-center gap-2 rounded-xl bg-amber-500 text-slate-950 px-3 py-1.5 text-xs font-black uppercase max-border shadow-lg">
        <WifiOff size={14} className="stroke-[3]" />
        <span>OFFLINE MODE</span>
      </div>
    );
  }

  return null;
};

/* JGFMusic v1.0.2 */
