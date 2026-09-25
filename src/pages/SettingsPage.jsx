import React, { useState, useEffect } from 'react';
import { 
  Zap, Disc, Waves, Check, Play, Download,
  Copy, ExternalLink, X, Upload, RotateCcw, Sparkles, Code, Award, Heart, RefreshCw
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { fileService } from '../services/fileService';
import { usePWAInstall } from '../hooks/usePWAInstall';

const SettingsPage = () => {
  const { 
    darkMode, 
    toggleDarkMode, 
    bgUrl, 
    setBackgroundImage, 
    splashStyle, 
    setSplashStyle,
    logoUrl,
    setLogoImage
  } = useTheme();

  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [logoLoading, setLogoLoading] = useState(false);

  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState('');

  const handleForceUpdate = async () => {
    setUpdating(true);
    setUpdateMsg('Clearing old cache and fetching the latest application version...');
    try {
      // 1. Unregister active service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          if (reg.active) {
            reg.active.postMessage({ type: 'CLEAR_CACHE' });
          }
          await reg.unregister();
        }
      }

      // 2. Clear browser Cache Storage
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }

      setUpdateMsg('Success! Refreshing the web app now...');
      setTimeout(() => {
        // Force bypass browser cache reload
        window.location.reload();
      }, 800);
    } catch (err) {
      console.error('Update error:', err);
      window.location.reload();
    }
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) return;
    }
    setShowInstallModal(true);
  };

  const handleCopyUrl = () => {
    const appUrl = window.location.origin;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(appUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  const handleOpenInNewTab = () => {
    window.open(window.location.origin, '_blank');
  };

  const handleImagePick = async () => {
    const file = await fileService.pickImageFile();
    if (file) {
      await setBackgroundImage(file);
    }
  };

  const handleRemoveBg = async () => {
    await setBackgroundImage(null);
  };

  const handleLogoPick = async () => {
    try {
      setLogoLoading(true);
      const file = await fileService.pickImageFile();
      if (file) {
        await setLogoImage(file);
      }
    } catch (err) {
      console.error('Logo upload error:', err);
    } finally {
      setLogoLoading(false);
    }
  };

  const handleResetLogo = async () => {
    await setLogoImage(null);
  };

  const handlePreviewStyle = (styleId) => {
    window.dispatchEvent(new CustomEvent('jgf:replay-splash', { detail: { style: styleId } }));
  };

  const splashOptions = [
    {
      id: 'neon',
      name: 'NEON PULSE',
      tag: 'CYBERPUNK EQUALIZER',
      desc: 'Glowing shockwave rings, 12-band dancing equalizer spectrum & high-energy cyberpunk beat',
      icon: Zap,
      accent: 'from-fuchsia-600 via-purple-600 to-cyan-500',
      tagColor: 'bg-fuchsia-500/20 text-fuchsia-800 dark:text-fuchsia-300 border-fuchsia-500/40',
      activeBorder: 'border-fuchsia-500 bg-fuchsia-500/10'
    },
    {
      id: 'vinyl',
      name: 'VINYL RETRO',
      tag: 'TURNTABLE & 33 RPM',
      desc: 'Spinning grooved vinyl LP disc, golden tonearm needle & warm analog vacuum tubes',
      icon: Disc,
      accent: 'from-amber-600 via-yellow-600 to-amber-800',
      tagColor: 'bg-amber-500/20 text-amber-900 dark:text-amber-300 border-amber-500/40',
      activeBorder: 'border-amber-500 bg-amber-500/10'
    },
    {
      id: 'minimal',
      name: 'STUDIO MINIMAL',
      tag: 'OSCILLOSCOPE & 24-BIT',
      desc: 'Matte titanium monitor, real-time sine audio wave, dual VU ladders & 96kHz lossless telemetry',
      icon: Waves,
      accent: 'from-cyan-600 via-teal-600 to-slate-800',
      tagColor: 'bg-cyan-500/20 text-cyan-900 dark:text-cyan-300 border-cyan-500/40',
      activeBorder: 'border-cyan-500 bg-cyan-500/10'
    }
  ];

  return (
    <div className="pb-56 sm:pb-64 px-4 max-w-2xl mx-auto min-h-screen select-none">
      {/* Check for Updates / Sync Latest Version Card */}
      <div className="bg-indigo-50 dark:bg-slate-800 max-border rounded-3xl max-shadow p-5 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 max-border flex items-center justify-center flex-shrink-0 shadow-sm">
              <RefreshCw size={22} className={`stroke-[2.5] ${updating ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-indigo-950 dark:text-white text-xl sm:text-2xl uppercase tracking-tight">
                  Update App
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-600 text-white dark:bg-indigo-400 dark:text-slate-950">
                  V2.2.0
                </span>
              </div>
              <p className="text-indigo-700 dark:text-amber-300 text-xs sm:text-sm font-black uppercase tracking-wide">
                Get the latest update and clear cached assets
              </p>
            </div>
          </div>
          <button
            type="button"
            id="force-update-app-btn"
            disabled={updating}
            onClick={handleForceUpdate}
            className="px-5 py-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs uppercase rounded-xl max-border flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm self-start sm:self-auto cursor-pointer disabled:opacity-50"
            title="Refresh and clear cached application files"
          >
            <RefreshCw size={15} className={updating ? 'animate-spin' : ''} />
            <span>{updating ? 'UPDATING...' : 'CHECK UPDATE'}</span>
          </button>
        </div>
        {updateMsg && (
          <div className="mt-3 p-3 bg-white dark:bg-slate-900 max-border rounded-xl text-xs font-black text-indigo-900 dark:text-amber-300 animate-fadeIn">
            {updateMsg}
          </div>
        )}
      </div>

      {/* Install App Section */}
      <div className="bg-indigo-50 dark:bg-slate-800 max-border rounded-3xl max-shadow p-5 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white max-border flex items-center justify-center flex-shrink-0 shadow-sm">
              <Download size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-indigo-950 dark:text-white text-xl sm:text-2xl uppercase tracking-tight">
                  Download App
                </h3>
                {isInstalled && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40">
                    INSTALLED
                  </span>
                )}
              </div>
              <p className="text-indigo-700 dark:text-amber-300 text-xs sm:text-sm font-black uppercase tracking-wide">
                Install on your phone for offline playback
              </p>
            </div>
          </div>
          <button
            type="button"
            id="install-phone-app-btn"
            onClick={handleInstallClick}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase rounded-xl max-border flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm self-start sm:self-auto cursor-pointer"
          >
            <Download size={15} />
            <span>{isInstalled ? 'GUIDE' : 'INSTALL APP'}</span>
          </button>
        </div>
      </div>

      {/* Dark Mode Card */}
      <div className="bg-indigo-50 dark:bg-slate-800 max-border rounded-3xl max-shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-black text-indigo-950 dark:text-white text-2xl uppercase tracking-tight">Dark Mode</h3>
            <p className="text-indigo-700 dark:text-amber-300 text-xs font-black uppercase tracking-wider mt-0.5">DARK & SLEEK THEME</p>
          </div>
          <button 
            type="button"
            onClick={toggleDarkMode}
            className={`w-20 h-10 flex items-center max-border rounded-full transition-colors cursor-pointer ${darkMode ? 'bg-indigo-600' : 'bg-gray-300'}`}
          >
            <div className={`w-8 h-8 max-border rounded-full transform transition-transform ${darkMode ? 'translate-x-10 bg-indigo-50' : 'translate-x-1 bg-white'}`} />
          </button>
        </div>
      </div>

      {/* Splash Screen Customizer Section */}
      <div className="bg-indigo-50 dark:bg-slate-800 max-border rounded-3xl max-shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-black text-indigo-950 dark:text-white text-2xl uppercase tracking-tight">Splash Screen</h3>
          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-200 dark:bg-slate-900 text-indigo-950 dark:text-amber-300 border-2 border-indigo-500/40">
            3 STYLES
          </span>
        </div>
        <p className="text-indigo-700 dark:text-amber-300 text-xs font-black uppercase tracking-wider mb-4">CHOOSE YOUR STARTUP INTRO STYLE</p>
        
        <div className="flex flex-col gap-3 mb-4">
          {splashOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = (splashStyle || 'neon') === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => setSplashStyle(opt.id)}
                className={`p-4 rounded-2xl max-border cursor-pointer transition-all ${
                  isSelected 
                    ? `${opt.activeBorder} shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_#fff]` 
                    : 'bg-white/60 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${opt.accent} text-white shadow-md mt-0.5`}>
                      <Icon size={22} className="stroke-[2.5]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <h4 className="text-base font-black uppercase tracking-tight text-indigo-950 dark:text-indigo-50">
                          {opt.name}
                        </h4>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${opt.tagColor}`}>
                          {opt.tag}
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 leading-snug">
                        {opt.desc}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-center flex-shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewStyle(opt.id);
                      }}
                      className="px-2.5 py-1.5 text-[10px] font-black uppercase rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
                      title={`Preview ${opt.name} Splash`}
                    >
                      <Play size={11} fill="currentColor" />
                      <span>PREVIEW</span>
                    </button>
                    <div className={`w-6 h-6 rounded-full max-border flex items-center justify-center ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-transparent text-transparent'
                    }`}>
                      <Check size={14} className="stroke-[3]" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Head Logo Customizer */}
      <div className="bg-indigo-50 dark:bg-slate-800 max-border rounded-3xl max-shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-black text-indigo-950 dark:text-white text-2xl uppercase tracking-tight">
            Head Logo
          </h3>
          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-200 dark:bg-slate-900 text-indigo-950 dark:text-amber-300 border-2 border-indigo-500/40">
            {logoUrl ? 'CUSTOM' : 'DEFAULT'}
          </span>
        </div>
        <p className="text-indigo-700 dark:text-amber-300 text-xs font-black uppercase tracking-wider mb-4">
          CUSTOM LOGO IN APP HEADER
        </p>
        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 max-border mb-4 flex items-center gap-4">
          <div className="bg-indigo-600 text-white dark:bg-indigo-50 dark:text-indigo-950 max-border rounded-full w-14 h-14 flex items-center justify-center overflow-hidden p-0.5 flex-shrink-0 shadow-md">
            <img 
              src={logoUrl || '/icon.svg'} 
              alt="Head Logo Preview" 
              className="w-full h-full object-cover rounded-full"
              onError={(e) => { e.currentTarget.src = '/icon.svg'; }}
            />
          </div>
          <div>
            <span className="text-base font-black uppercase tracking-tight text-indigo-950 dark:text-white">
              JGFMusic Logo
            </span>
            <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5">
              {logoUrl ? 'Custom logo active in header.' : 'Default official logo active.'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleLogoPick}
            disabled={logoLoading}
            className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase rounded-xl max-border flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
          >
            <Upload size={16} />
            <span>{logoLoading ? 'UPLOADING...' : 'UPLOAD LOGO'}</span>
          </button>
          {logoUrl && (
            <button
              type="button"
              onClick={handleResetLogo}
              className="py-3 px-3 bg-red-500 hover:bg-red-600 text-white font-black text-xs uppercase rounded-xl max-border flex items-center justify-center gap-1 cursor-pointer"
            >
              <RotateCcw size={15} />
              <span>RESET</span>
            </button>
          )}
        </div>
      </div>

      {/* Background Customizer */}
      <div className="bg-indigo-50 dark:bg-slate-800 max-border rounded-3xl max-shadow p-6 mb-6">
        <h3 className="font-black text-indigo-950 dark:text-white text-2xl uppercase tracking-tight mb-1">Background</h3>
        <p className="text-indigo-700 dark:text-amber-300 text-xs font-black uppercase tracking-wider mb-4">CUSTOMIZE THE BACKGROUND</p>
        <div className="flex gap-2">
          <button 
            type="button"
            onClick={handleImagePick} 
            className="flex-1 px-4 py-3 font-black text-xs uppercase bg-indigo-600 text-white dark:bg-indigo-50 dark:text-indigo-950 max-border rounded-xl hover:bg-gray-800 transition-colors cursor-pointer"
          >
            {bgUrl ? 'CHANGE BG' : 'SET BACKGROUND IMAGE'}
          </button>
          {bgUrl && (
            <button 
              type="button"
              onClick={handleRemoveBg} 
              className="px-4 py-3 font-black text-xs uppercase bg-red-500 text-white max-border rounded-xl hover:bg-red-600 transition-colors cursor-pointer"
            >
              REMOVE
            </button>
          )}
        </div>
      </div>

      {/* Developer Credits (Jerome Urbano) */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white max-border rounded-3xl max-shadow p-6 mb-6 border-2 border-indigo-400/40">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
            OFFICIAL DEVELOPER CREDIT
          </span>
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[10px] font-black">
            <Award size={12} />
            <span>CREATOR</span>
          </div>
        </div>
        <div className="flex items-center gap-3.5 mb-4 pb-3 border-b border-indigo-700/50">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-500 to-indigo-600 p-0.5 shadow-lg flex-shrink-0 flex items-center justify-center max-border">
            <div className="w-full h-full bg-slate-900 rounded-[12px] flex flex-col items-center justify-center text-amber-300">
              <Code size={22} className="stroke-[2.5]" />
              <span className="text-[8px] font-black uppercase tracking-wider text-white">DEV</span>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-1.5">
              Jerome Urbano
              <Sparkles size={18} className="text-amber-400" />
            </h2>
            <p className="text-xs font-black uppercase tracking-wider text-indigo-300">
              Lead App Creator & Developer
            </p>
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs text-indigo-50 leading-relaxed font-bold">
          "Welcome and thank you for using JGFMusic! This application was crafted and built by <span className="text-amber-300 underline font-black">Jerome Urbano</span> as the lead developer and creator."
        </div>
      </div>

      <p className="text-center font-black text-sm text-indigo-700 dark:text-amber-400 mt-8 uppercase tracking-widest">JGFMUSIC V2.0.0 • OFFLINE MUSIC PLAYER</p>

      {/* Install Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-indigo-50 dark:bg-slate-900 text-indigo-950 dark:text-indigo-50 max-border rounded-2xl max-shadow max-w-sm w-full p-5 space-y-3 relative">
            <div className="flex items-center justify-between border-b-2 border-indigo-200 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-black uppercase">Install on Phone</h3>
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="p-1 rounded-lg bg-gray-200 dark:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-2 text-xs font-bold text-gray-700 dark:text-gray-300">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-800 max-border flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center">1</span>
                <span>Open this link in Chrome on your phone.</span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-800 max-border flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center">2</span>
                <span>Tap the 3 dots menu in your browser.</span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-800 max-border flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center">3</span>
                <span>Select "Install App" or "Add to Home Screen".</span>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyUrl}
                className="flex-1 py-2 px-3 bg-indigo-600 text-white font-black text-xs uppercase rounded-xl max-border flex items-center justify-center gap-1"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
              <button
                type="button"
                onClick={handleOpenInNewTab}
                className="py-2 px-3 bg-white dark:bg-slate-800 text-indigo-950 dark:text-white font-black text-xs uppercase rounded-xl max-border flex items-center justify-center gap-1"
              >
                <ExternalLink size={14} />
                <span>Open</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;

/* JGFMusic v1.0.2 */
