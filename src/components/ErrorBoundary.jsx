import React from 'react';
import { AlertTriangle, RefreshCw, Trash2, Music } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      // Clear non-audio caches to prevent corrupted state
      sessionStorage.clear();
      // Keep songs and playlists in idb/localStorage if possible, but clear transient states
      localStorage.removeItem('recentlyPlayed');
      localStorage.removeItem('listeningHistory');
    } catch (e) {
      console.warn('Reset error:', e);
    }
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center select-none font-sans">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-5 border border-amber-500/30 shadow-lg shadow-amber-500/10">
            <AlertTriangle size={32} />
          </div>

          <h1 className="text-2xl font-black tracking-tight mb-2 text-white">
            Oops! JGFMusic encountered a glitch
          </h1>

          <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
            The application prevented a white screen crash. You can reload the player safely to continue enjoying your music.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs mb-6">
            <button
              onClick={this.handleReload}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <RefreshCw size={16} />
              Reload App
            </button>
            <button
              onClick={this.handleReset}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm border border-slate-700 transition-all active:scale-95"
              title="Clear temporary cache and restart"
            >
              <Trash2 size={16} />
              Reset Cache
            </button>
          </div>

          {this.state.error && (
            <details className="text-left w-full max-w-md bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 cursor-pointer">
              <summary className="font-mono text-slate-300">Technical Details</summary>
              <pre className="mt-2 whitespace-pre-wrap break-all font-mono text-[11px] text-amber-300/80">
                {this.state.error?.toString()}
              </pre>
            </details>
          )}

          <div className="mt-8 flex items-center gap-2 text-slate-500 text-xs">
            <Music size={14} />
            <span>JGFMusic Standalone Player</span>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
