import React from 'react';
import { Play, X, Clock, Music, ListMusic, Volume2, CheckCircle2 } from 'lucide-react';

export const ScheduledAlarmPrompt = ({ promptData, onConfirm, onDismiss }) => {
  if (!promptData) return null;

  const isPlaylist = promptData.type === 'playlist';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-4 animate-in fade-in duration-200 select-none">
      <div className="bg-indigo-950/95 dark:bg-slate-900/95 border-2 border-amber-400 rounded-3xl max-shadow p-6 sm:p-8 w-full max-w-md text-white shadow-2xl relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Badge */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-sm animate-pulse">
            <Clock size={14} className="stroke-[3]" />
            <span>Scheduled Time Reached!</span>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Dismiss"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Icon & Details */}
        <div className="flex items-center gap-4 mb-6 bg-white/5 border border-white/10 p-4 rounded-2xl">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-indigo-600 flex items-center justify-center text-slate-950 shrink-0 shadow-lg">
            {isPlaylist ? <ListMusic size={28} className="stroke-[2.5]" /> : <Music size={28} className="stroke-[2.5]" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
              Ready To Play {isPlaylist ? 'Playlist' : 'Track'}
            </p>
            <h3 className="text-xl font-black uppercase text-white truncate tracking-tight">
              {promptData.title || 'Scheduled Music'}
            </h3>
            <p className="text-xs text-slate-300 font-medium truncate mt-0.5">
              Scheduled for <span className="font-mono text-amber-300 font-bold">{promptData.time}</span>
            </p>
          </div>
        </div>

        {/* Informative Note */}
        <div className="flex items-center gap-2.5 text-xs text-slate-300 mb-6 bg-amber-400/10 border border-amber-400/30 p-3 rounded-xl">
          <Volume2 size={18} className="text-amber-400 shrink-0" />
          <span>Tap <strong>PLAY NOW ✅</strong> to start instant audio playback.</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onDismiss}
            className="flex-1 py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl border border-slate-700 font-black text-sm uppercase transition-all cursor-pointer"
          >
            DISMISS
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="flex-[2] py-3.5 px-4 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 rounded-2xl font-black text-base uppercase transition-all flex items-center justify-center gap-2 shadow-[0_4px_18px_rgba(251,191,36,0.4)] cursor-pointer"
          >
            <Play size={18} fill="currentColor" />
            <span>PLAY NOW ✅</span>
          </button>
        </div>
      </div>
    </div>
  );
};
