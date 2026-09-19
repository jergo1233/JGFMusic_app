import React from 'react';
import { Volume2, Volume1, VolumeX } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

const VolumeControl = ({ className = '' }) => {
  const { volume, isMuted, changeVolume, toggleMute } = usePlayer();

  const handleSliderChange = (e) => {
    const val = parseFloat(e.target.value);
    changeVolume(val);
  };

  const currentVolume = isMuted ? 0 : volume;
  const percent = Math.round(currentVolume * 100);

  const getVolumeIcon = () => {
    if (isMuted || currentVolume === 0) {
      return <VolumeX size={22} className="text-red-400 stroke-[2.5]" />;
    }
    if (currentVolume < 0.5) {
      return <Volume1 size={22} className="text-amber-300 stroke-[2.5]" />;
    }
    return <Volume2 size={22} className="text-emerald-400 stroke-[2.5]" />;
  };

  return (
    <div className={`flex items-center gap-3 p-3 bg-indigo-950/70 dark:bg-slate-900/80 max-border rounded-2xl ${className}`}>
      {/* Mute / Unmute Button */}
      <button
        type="button"
        onClick={toggleMute}
        title={isMuted ? "Unmute Volume" : "Mute Volume"}
        className="p-2 rounded-xl bg-black/40 hover:bg-black/60 text-white max-border transition-transform active:scale-95 flex-shrink-0 cursor-pointer"
      >
        {getVolumeIcon()}
      </button>

      {/* Volume Slider */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider text-white mb-1 px-1 drop-shadow-sm">
          <span>VOLUME</span>
          <span className="font-mono text-amber-300 font-black">{percent}%</span>
        </div>
        <input
          id="volume-slider"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={currentVolume}
          onChange={handleSliderChange}
          className="w-full h-3 bg-slate-800 rounded-full appearance-none cursor-pointer accent-amber-400 max-border"
          title={`Volume: ${percent}%`}
        />
      </div>
    </div>
  );
};

export default VolumeControl;
