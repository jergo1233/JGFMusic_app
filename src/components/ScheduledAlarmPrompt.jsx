import React, { useState, useEffect } from 'react';
import { BellRing, Volume2, Square, RotateCcw, Play, Music, ListMusic } from 'lucide-react';

export const ScheduledAlarmPrompt = ({ promptData, onConfirm, onDismiss, onSnooze }) => {
  const [liveTime, setLiveTime] = useState('');

  useEffect(() => {
    if (!promptData) return;

    const updateClock = () => {
      const now = new Date();
      setLiveTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [promptData]);

  if (!promptData) return null;

  const isPlaylist = promptData.type === 'playlist';

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-xl px-4 animate-in fade-in duration-300 select-none overflow-y-auto">
      {/* Phone alarm clock full screen card */}
      <div className="w-full max-w-sm sm:max-w-md bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 border-2 border-amber-400/80 rounded-3xl max-shadow p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden my-auto">
        {/* Pulsing alarm ambient circles */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Live Digital Alarm Clock Display */}
        <div className="text-center mb-6 relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-400 text-slate-950 mb-3 shadow-[0_0_35px_rgba(251,191,36,0.6)] animate-bounce">
            <BellRing size={40} className="stroke-[2.5]" />
          </div>

          <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-400 mb-1 animate-pulse">
            ⏰ ALARM RINGING
          </p>

          <h2 className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white drop-shadow-md">
            {liveTime || promptData.time}
          </h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Phone Alarm Clock
          </p>
        </div>

        {/* Song / Playlist Info Badge */}
        <div className="bg-white/10 border border-white/15 rounded-2xl p-4 mb-6 flex items-center gap-3.5 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
            {isPlaylist ? <ListMusic size={24} className="stroke-[2.5]" /> : <Music size={24} className="stroke-[2.5]" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-300">
              Playing {isPlaylist ? 'Playlist' : 'Track'}
            </p>
            <h3 className="text-lg font-black uppercase truncate text-white">
              {promptData.title || 'Alarm Music'}
            </h3>
            <p className="text-xs text-slate-300 truncate">
              Target time: <span className="font-mono text-amber-300 font-bold">{promptData.time}</span>
            </p>
          </div>
        </div>

        {/* Audio Loudness Status */}
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-400 mb-6 bg-emerald-500/10 border border-emerald-500/20 py-2.5 px-3 rounded-xl">
          <Volume2 size={16} className="shrink-0" />
          <span>Sound is playing at full volume with alarm vibration.</span>
        </div>

        {/* Action Controls: Snooze & Stop Alarm */}
        <div className="space-y-3 relative z-10">
          <div className="grid grid-cols-2 gap-3">
            {/* SNOOZE 5 MINS */}
            <button
              type="button"
              id="alarm-snooze-btn"
              onClick={() => onSnooze ? onSnooze(promptData) : onDismiss()}
              className="py-4 px-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-300 hover:text-amber-200 border-2 border-amber-400/40 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
            >
              <RotateCcw size={16} className="stroke-[2.5]" />
              <span>SNOOZE (+5M)</span>
            </button>

            {/* STOP / DISMISS ALARM */}
            <button
              type="button"
              id="alarm-stop-btn"
              onClick={onDismiss}
              className="py-4 px-3 bg-red-600 hover:bg-red-500 active:scale-95 text-white border-2 border-red-400 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_20px_rgba(239,68,68,0.4)] transition-all"
            >
              <Square size={16} fill="currentColor" />
              <span>STOP ALARM</span>
            </button>
          </div>

          {/* KEEP PLAYING AS MUSIC */}
          <button
            type="button"
            id="alarm-keep-playing-btn"
            onClick={onConfirm}
            className="w-full py-3.5 px-4 bg-amber-400 hover:bg-amber-300 active:scale-98 text-slate-950 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_16px_rgba(251,191,36,0.3)] transition-all"
          >
            <Play size={16} fill="currentColor" />
            <span>KEEP PLAYING MUSIC</span>
          </button>
        </div>
      </div>
    </div>
  );
};
