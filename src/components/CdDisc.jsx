import React from 'react';

const CdDisc = ({ isPlaying = false, title = '', artist = '', className = '', compact = false }) => {
  return (
    <div
      className={`relative rounded-full aspect-square flex items-center justify-center select-none overflow-hidden ${
        isPlaying ? 'cd-spinning' : ''
      } ${className}`}
      style={{
        background: 'conic-gradient(from 180deg at 50% 50%, #64748b 0deg, #94a3b8 45deg, #c084fc 90deg, #38bdf8 135deg, #94a3b8 180deg, #f472b6 225deg, #fbbf24 270deg, #94a3b8 315deg, #64748b 360deg)',
        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.35)'
      }}
    >
      {/* Glossy holographic sheen overlay */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none opacity-50"
        style={{
          background: 'conic-gradient(from 45deg at 50% 50%, transparent 0deg, rgba(255,255,255,0.65) 30deg, transparent 60deg, transparent 180deg, rgba(255,255,255,0.65) 210deg, transparent 240deg, transparent 360deg)'
        }}
      />
      {/* Concentric CD audio grooves */}
      <div className="absolute inset-[4%] rounded-full border border-white/20 pointer-events-none" />
      <div className="absolute inset-[9%] rounded-full border border-black/25 pointer-events-none" />
      <div className="absolute inset-[14%] rounded-full border border-white/25 pointer-events-none" />
      <div className="absolute inset-[20%] rounded-full border border-black/30 pointer-events-none" />
      <div className="absolute inset-[26%] rounded-full border border-white/20 pointer-events-none" />

      {/* Clear plastic mirror transition ring */}
      <div
        className="absolute inset-[32%] rounded-full border-2 border-white/40 shadow-inner flex items-center justify-center"
        style={{
          background: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(2px)'
        }}
      >
        {/* Center label hub */}
        <div
          className="w-[78%] h-[78%] rounded-full bg-indigo-950 border-2 border-indigo-400/60 shadow-lg flex flex-col items-center justify-center text-center p-1 text-white relative overflow-hidden"
          style={{
            background: 'radial-gradient(circle, #1e1b4b 0%, #0f172a 100%)'
          }}
        >
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:6px_6px]" />
          {!compact && (
            <div className="relative z-10 flex flex-col items-center justify-center max-w-[85%]">
              <span className="text-[9px] font-black tracking-widest text-indigo-300 uppercase leading-none truncate max-w-full">
                {artist || 'JGFMUSIC'}
              </span>
              <span className="text-[10px] font-extrabold text-amber-300 uppercase leading-tight truncate max-w-full mt-0.5">
                {title || 'COMPACT DISC'}
              </span>
              <span className="text-[7px] font-bold tracking-wider text-indigo-400/80 uppercase mt-0.5">
                DIGITAL AUDIO
              </span>
            </div>
          )}
          {compact && (
            <div className="relative z-10 flex items-center justify-center">
              <span className="text-[8px] font-black text-indigo-300 tracking-tighter">CD</span>
            </div>
          )}
          {/* Center spindle hole */}
          <div className="absolute w-[30%] h-[30%] rounded-full bg-slate-950 border-2 border-white/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] z-20 flex items-center justify-center">
            <div className="w-[45%] h-[45%] rounded-full bg-transparent border border-white/30" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CdDisc;

/* JGFMusic v1.0.2 */
