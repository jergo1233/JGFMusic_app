import React, { useState } from 'react';
import { Download, Share2, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton = ({ className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  // If already installed or running standalone, hide the quick install button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop Chrome PWA prompt flow
  if (isInstallable) {
    return (
      <button
        type="button"
        id="pwa-header-install-btn"
        onClick={install}
        className={`px-2.5 sm:px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] sm:text-xs uppercase rounded-xl max-border flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer flex-shrink-0 ${className}`}
        title="Install JGFMusic App"
      >
        <Download size={14} className="stroke-[3]" />
        <span className="hidden min-[380px]:inline">Install App</span>
        <span className="inline min-[380px]:hidden">Install</span>
      </button>
    );
  }

  // iOS Safari flow (since beforeinstallprompt is not fired on WebKit)
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          id="pwa-header-ios-install-btn"
          onClick={() => setShowIOSModal(true)}
          className={`px-2.5 sm:px-3.5 py-1.5 bg-indigo-600/90 hover:bg-indigo-700 text-white font-black text-[11px] sm:text-xs uppercase rounded-xl max-border flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer flex-shrink-0 ${className}`}
          title="Install JGFMusic on iPhone / iPad"
        >
          <Download size={14} className="stroke-[3]" />
          <span className="hidden min-[380px]:inline">Install App</span>
          <span className="inline min-[380px]:hidden">Install</span>
        </button>

        {showIOSModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-indigo-50 dark:bg-slate-900 max-border rounded-3xl max-shadow p-6 max-w-sm w-full relative">
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white max-border flex items-center justify-center shadow-md">
                  <Download size={22} className="stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-black text-xl uppercase tracking-tight text-indigo-950 dark:text-white">
                    Install on iPhone
                  </h3>
                  <p className="text-[11px] font-black uppercase text-indigo-700 dark:text-amber-300">
                    Add to Home Screen
                  </p>
                </div>
              </div>

              <div className="space-y-3 bg-white/70 dark:bg-slate-800/70 p-4 rounded-2xl max-border text-xs font-bold text-slate-800 dark:text-slate-200 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-slate-700 flex items-center justify-center text-indigo-600 dark:text-amber-300 flex-shrink-0">
                    <Share2 size={16} />
                  </div>
                  <span>1. Tap the <strong className="text-indigo-950 dark:text-white">Share</strong> button in the Safari bottom bar.</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-slate-700 flex items-center justify-center text-indigo-600 dark:text-amber-300 flex-shrink-0">
                    <PlusSquare size={16} />
                  </div>
                  <span>2. Scroll down and select <strong className="text-indigo-950 dark:text-white">Add to Home Screen</strong>.</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-slate-700 flex items-center justify-center text-indigo-600 dark:text-amber-300 flex-shrink-0">
                    <span className="font-black text-xs">3</span>
                  </div>
                  <span>3. Tap <strong className="text-indigo-950 dark:text-white">Add</strong> in top right. Launch directly from your home screen!</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase rounded-xl max-border shadow-sm active:scale-95 transition cursor-pointer"
              >
                GOT IT
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
