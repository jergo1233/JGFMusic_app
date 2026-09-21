import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { LibraryProvider } from './context/LibraryContext';
import { PlayerProvider } from './context/PlayerContext';
import { ThemeProvider } from './context/ThemeContext';
import Home from './pages/Home';
import Library from './pages/Library';
import Playlists from './pages/Playlists';
import PlaylistDetail from './pages/PlaylistDetail';
import HistoryPage from './pages/HistoryPage';
import SchedulePage from './pages/SchedulePage';
import SettingsPage from './pages/SettingsPage';
import NowPlayingPage from './pages/NowPlayingPage';
import BottomNav from './components/BottomNav';
import MiniPlayer from './components/MiniPlayer';
import Background from './components/Background';
import Header from './components/Header';
import SplashScreen from './components/SplashScreen';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ScheduledAlarmPrompt } from './components/ScheduledAlarmPrompt';
import { usePlayer } from './context/PlayerContext';

const AppContent = () => {
  const location = useLocation();
  const hideNav = location.pathname === '/now-playing';
  const [showSplash, setShowSplash] = useState(() => {
    // Only show splash screen once per tab session unless triggered explicitly
    try {
      const shown = sessionStorage.getItem('jgf_has_shown_splash');
      if (shown) return false;
      sessionStorage.setItem('jgf_has_shown_splash', 'true');
      return true;
    } catch (e) {
      return true;
    }
  });
  const [previewStyle, setPreviewStyle] = useState(null);
  const { scheduledAlarmPrompt, confirmScheduledPlay, dismissScheduledAlarmPrompt, snoozeScheduledAlarm } = usePlayer();

  useEffect(() => {
    const handleReplay = (e) => {
      setPreviewStyle(e.detail?.style || null);
      setShowSplash(true);
    };
    window.addEventListener('jgf:replay-splash', handleReplay);
    return () => window.removeEventListener('jgf:replay-splash', handleReplay);
  }, []);

  // Failsafe: Ensure splash screen never hangs longer than 2.5 seconds under any circumstance
  useEffect(() => {
    if (showSplash) {
      const safetyTimer = setTimeout(() => {
        setShowSplash(false);
        setPreviewStyle(null);
      }, 2500);
      return () => clearTimeout(safetyTimer);
    }
  }, [showSplash]);

  return (
    <div className="min-h-screen font-sans text-indigo-950 dark:text-indigo-50 transition-colors duration-300 relative z-0">
      <OfflineIndicator />

      {/* Splash Screen as high-priority overlay */}
      {showSplash && (
        <SplashScreen 
          overrideStyle={previewStyle}
          onComplete={() => {
            setShowSplash(false);
            setPreviewStyle(null);
          }} 
        />
      )}

      <Background />

      {!hideNav && (
        <div className="fixed top-0 left-0 right-0 z-30 bg-indigo-50/80 dark:bg-slate-900/80 backdrop-blur-xl pt-4 pb-3 px-4 shadow-sm border-b-2 border-indigo-900/10 dark:border-indigo-300/10">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <Header />
            <PWAInstallButton />
          </div>
        </div>
      )}

      {/* Main Routes Pre-rendered to prevent blank white flashes */}
      <div className={hideNav ? "" : "pt-24"}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/library" element={<Library />} />
          <Route path="/playlists" element={<Playlists />} />
          <Route path="/playlists/:id" element={<PlaylistDetail />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/scheduled" element={<SchedulePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/now-playing" element={<NowPlayingPage />} />
        </Routes>
      </div>
      
      {!hideNav && (
        <>
          <MiniPlayer />
          <BottomNav />
        </>
      )}

      {/* Global High-Priority Scheduled Playback Prompt & Confirmation Modal */}
      <ScheduledAlarmPrompt
        promptData={scheduledAlarmPrompt}
        onConfirm={confirmScheduledPlay}
        onDismiss={dismissScheduledAlarmPrompt}
        onSnooze={snoozeScheduledAlarm}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <LibraryProvider>
        <PlayerProvider>
          <Router>
            <AppContent />
          </Router>
        </PlayerProvider>
      </LibraryProvider>
    </ThemeProvider>
  );
}

/* JGFMusic v1.0.2 */
