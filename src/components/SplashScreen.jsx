import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Disc3, Zap, Waves, Disc, Activity, Sparkles, Volume2, Sliders } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const SplashScreen = ({ onComplete, overrideStyle }) => {
  const { splashStyle: savedStyle, logoUrl } = useTheme();
  const currentStyle = overrideStyle || savedStyle || 'neon';
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  const [imgError, setImgError] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const statusMessagesMap = {
    neon: [
      'INITIALIZING JGFMusic ENGINE...',
      'POWERING UP NEON EQUALIZERS...',
      'SYNCING BASS RESONANCE...',
      'READY TO DROP THE BEAT!'
    ],
    vinyl: [
      'PLACING VINYL ON PLATTER...',
      'LOWERING TURNTABLE NEEDLE...',
      'WARMING HI-FI TUBES...',
      'SPINNING AT 33 RPM... READY!'
    ],
    minimal: [
      'LOADING LOSSLESS CODECS...',
      'CALIBRATING STUDIO FREQUENCIES...',
      'TUNING ACOUSTIC EQUALIZER...',
      'STUDIO ENGINE ACTIVE!'
    ]
  };

  const statusMessages = statusMessagesMap[currentStyle] || statusMessagesMap.neon;

  useEffect(() => {
    const duration = 2200;
    const intervalTime = 25;
    const step = (intervalTime / duration) * 100;
    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + step;
        if (next >= 100) {
          clearInterval(timer);
          return 100;
        }
        return next;
      });
    }, intervalTime);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (progress < 30) setStatusIndex(0);
    else if (progress < 65) setStatusIndex(1);
    else if (progress < 95) setStatusIndex(2);
    else setStatusIndex(3);

    if (progress >= 100 && !isExiting) {
      const exitTimer = setTimeout(() => {
        handleProceed();
      }, 400);
      return () => clearTimeout(exitTimer);
    }
  }, [progress, isExiting]);

  const handleProceed = () => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => {
      onComplete?.();
    }, 350);
  };

  // Shared Logo Component
  const renderLogo = (sizeClass = 'w-24 h-24') => {
    if (imgError || !logoUrl) {
      return (
        <div className={`w-full h-full flex flex-col items-center justify-center text-white`}>
          <Disc3 size={40} className="animate-spin text-purple-400 mb-0.5" style={{ animationDuration: '6s' }} />
          <span className="text-[10px] font-black tracking-widest uppercase">JGFM</span>
        </div>
      );
    }
    return (
      <img
        src={logoUrl}
        alt="JGFMusic Logo"
        onError={() => setImgError(true)}
        className="w-full h-full object-cover rounded-full"
      />
    );
  };

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          id="jgf-splash-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05, filter: 'blur(8px)' }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-between p-5 select-none overflow-hidden"
        >
          {/* ========================================================= */}
          {/* STYLE 1: NEON PULSE (Cyberpunk / Neon EDM Beat System)   */}
          {/* ========================================================= */}
          {currentStyle === 'neon' && (
            <div className="absolute inset-0 bg-[#080415] text-indigo-50 flex flex-col items-center justify-between p-6 overflow-hidden">
              {/* Glowing Cyberpunk Background Aura */}
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[340px] h-[340px] bg-gradient-to-tr from-fuchsia-600/30 via-purple-600/25 to-cyan-500/25 rounded-full blur-3xl pointer-events-none animate-pulse" />
              <div className="absolute inset-0 bg-[radial-gradient(#a855f7_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

              {/* Top Neon Badge */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-[0_0_15px_rgba(217,70,239,0.4)] backdrop-blur-md mt-3 border border-fuchsia-500/50 bg-slate-950/80 text-cyan-300 z-10"
              >
                <Zap size={14} className="text-fuchsia-400 fill-fuchsia-400 animate-bounce" />
                <span>NEON PULSE // 128 BPM</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-1" />
              </motion.div>

              {/* Center Hero: Glowing Ring + Dancing Equalizer Bars */}
              <div className="flex flex-col items-center justify-center my-auto z-10 w-full max-w-sm">
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                  className="relative mb-4"
                >
                  {/* Outer Concentric Shockwave Rings */}
                  <div className="absolute -inset-4 rounded-full border-2 border-dashed border-fuchsia-500/40 animate-spin" style={{ animationDuration: '20s' }} />
                  <div className="absolute -inset-2 rounded-full border border-cyan-400/50 animate-pulse" />

                  {/* Logo Center Container */}
                  <div className="relative w-28 h-28 sm:w-32 sm:h-32 bg-slate-950 border-4 border-fuchsia-500 rounded-full shadow-[0_0_35px_rgba(217,70,239,0.7)] flex items-center justify-center p-2 overflow-hidden">
                    {renderLogo()}
                  </div>
                </motion.div>

                {/* Animated 12-Band Dancing Equalizer Spectrum */}
                <div className="flex items-end justify-center gap-1.5 h-10 w-48 mb-4">
                  {[40, 85, 60, 100, 75, 95, 55, 90, 70, 85, 50, 65].map((val, idx) => (
                    <motion.div
                      key={idx}
                      className="w-2 rounded-full bg-gradient-to-t from-fuchsia-600 via-purple-400 to-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                      animate={{
                        height: [`${Math.max(20, val * 0.3)}%`, `${val}%`, `${Math.max(15, val * 0.45)}%`],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.4 + (idx % 4) * 0.15,
                        ease: 'easeInOut',
                      }}
                    />
                  ))}
                </div>

                {/* Typography */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                  className="text-center"
                >
                  <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 via-pink-400 to-cyan-300 drop-shadow-[0_0_20px_rgba(217,70,239,0.8)]">
                    JGFMusic
                  </h1>
                  <p className="mt-1.5 text-xs sm:text-sm font-black uppercase tracking-widest text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">
                    NEON BEAT SYSTEM • FEEL THE BASS
                  </p>
                </motion.div>
              </div>

              {/* Bottom Progress Bar & Button */}
              <div className="w-full max-w-sm flex flex-col items-center mb-6 z-10">
                <div className="w-full flex items-center justify-between text-xs font-mono font-bold uppercase mb-2 px-1 text-cyan-300">
                  <span className="truncate flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-fuchsia-500 animate-ping" />
                    {statusMessages[statusIndex]}
                  </span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-3.5 rounded-full overflow-hidden p-0.5 border-2 bg-slate-950 border-fuchsia-500/70 shadow-[0_0_15px_rgba(217,70,239,0.4)]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-fuchsia-600 via-purple-500 to-cyan-400 transition-all shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <button
                  id="splash-proceed-btn"
                  onClick={handleProceed}
                  className="mt-5 w-full py-3.5 px-6 rounded-2xl font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2 border-2 transition-all shadow-[0_0_25px_rgba(217,70,239,0.5)] bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 text-white border-fuchsia-400 cursor-pointer active:scale-98"
                >
                  <Sparkles size={18} className="text-cyan-300 animate-spin" style={{ animationDuration: '4s' }} />
                  <span>{progress >= 100 ? 'DROP THE BEAT' : 'ENTER PLAYER'}</span>
                  <ArrowRight size={18} className="stroke-[3]" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STYLE 2: VINYL RETRO (Classic Hi-Fi Turntable / 33 RPM)  */}
          {/* ========================================================= */}
          {currentStyle === 'vinyl' && (
            <div className="absolute inset-0 bg-[#140c08] text-amber-100 flex flex-col items-center justify-between p-6 overflow-hidden">
              {/* Warm Analog Ambient Glow */}
              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[380px] h-[380px] bg-gradient-to-b from-amber-600/25 via-orange-900/20 to-transparent rounded-full blur-3xl pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(#78350f_1px,transparent_1px)] [background-size:20px_20px] opacity-25 pointer-events-none" />

              {/* Top Vintage Brass Plaque Badge */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg border border-amber-500/50 bg-amber-950/80 text-amber-300 mt-3 z-10"
              >
                <Disc size={15} className="text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
                <span>RETRO HI-FI TURNTABLE • 33⅓ RPM</span>
              </motion.div>

              {/* Center Hero: Authentic Turntable Deck & Grooved Vinyl Record */}
              <div className="flex flex-col items-center justify-center my-auto z-10 w-full max-w-sm">
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                  className="relative mb-5 p-3 rounded-3xl bg-[#1f130b] border-2 border-amber-700/60 shadow-[0_16px_35px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(251,191,36,0.2)]"
                >
                  {/* Brass Platter Edge */}
                  <div className="relative w-44 h-44 sm:w-48 sm:h-48 rounded-full bg-gradient-to-br from-amber-600 via-amber-800 to-amber-950 p-1.5 shadow-2xl flex items-center justify-center">
                    
                    {/* Spinning Grooved Vinyl Disc */}
                    <div 
                      className="w-full h-full rounded-full bg-[#121212] relative flex items-center justify-center overflow-hidden animate-spin shadow-inner"
                      style={{
                        animationDuration: '6s',
                        backgroundImage: `repeating-radial-gradient(circle, #101010 0px, #101010 2px, #202020 3px, #101010 4px)`
                      }}
                    >
                      {/* Realistic Vinyl Light Glare Sheen */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/10 pointer-events-none" />
                      <div className="absolute inset-0 bg-gradient-to-bl from-amber-400/10 via-transparent to-amber-400/10 pointer-events-none" />

                      {/* Vintage Center Label with Logo */}
                      <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-amber-200 border-2 border-amber-600 p-1 shadow-md flex flex-col items-center justify-center overflow-hidden">
                        <div className="w-full h-full rounded-full bg-amber-900 border border-amber-400/60 flex items-center justify-center overflow-hidden p-0.5">
                          {renderLogo()}
                        </div>
                      </div>

                      {/* Center Spindle Hole */}
                      <div className="absolute w-2.5 h-2.5 rounded-full bg-amber-300 border border-amber-950 z-10" />
                    </div>

                    {/* Turntable Tonearm with Golden Stylus Needle */}
                    <div className="absolute -top-3 -right-3 w-16 h-28 pointer-events-none flex flex-col items-end">
                      {/* Tonearm Pivot */}
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-800 border-2 border-amber-300 shadow-md mr-1" />
                      {/* Golden Arm */}
                      <div className="w-1 h-20 bg-gradient-to-b from-amber-300 via-amber-400 to-yellow-600 -mt-1 mr-3 transform -rotate-15 shadow" />
                      {/* Cartridge & Needle */}
                      <div className="w-3 h-5 bg-stone-900 border border-amber-400 rounded-sm mr-2 transform -rotate-25 shadow-lg" />
                    </div>
                  </div>
                </motion.div>

                {/* Typography */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                  className="text-center"
                >
                  <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-wide text-amber-100 drop-shadow-[0_4px_12px_rgba(245,158,11,0.5)]">
                    JGFMusic
                  </h1>
                  <p className="mt-1.5 text-xs sm:text-sm font-extrabold uppercase tracking-widest text-amber-400">
                    CLASSIC HI-FI • WARM ANALOG TUBES
                  </p>
                </motion.div>
              </div>

              {/* Bottom Progress Bar & Button */}
              <div className="w-full max-w-sm flex flex-col items-center mb-6 z-10">
                <div className="w-full flex items-center justify-between text-xs font-bold uppercase mb-2 px-1 text-amber-300">
                  <span className="truncate flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    {statusMessages[statusIndex]}
                  </span>
                  <span>{Math.round(progress)}%</span>
                </div>
                {/* Analog VU-Tuner Styled Progress Bar */}
                <div className="w-full h-3.5 rounded-full overflow-hidden p-0.5 border-2 bg-amber-950/90 border-amber-600/70 shadow-inner">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-700 via-amber-500 to-yellow-300 transition-all shadow-[0_0_12px_rgba(245,158,11,0.7)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <button
                  id="splash-proceed-btn"
                  onClick={handleProceed}
                  className="mt-5 w-full py-3.5 px-6 rounded-2xl font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2 border-2 transition-all shadow-[0_6px_20px_rgba(217,119,6,0.4)] bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 text-stone-950 border-amber-300 cursor-pointer active:scale-98"
                >
                  <Volume2 size={18} className="text-stone-950 stroke-[2.5]" />
                  <span>{progress >= 100 ? 'SPIN THE RECORD' : 'START TURNTABLE'}</span>
                  <ArrowRight size={18} className="stroke-[3]" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STYLE 3: STUDIO MINIMAL (Audiophile Oscilloscope Monitor) */}
          {/* ========================================================= */}
          {currentStyle === 'minimal' && (
            <div className="absolute inset-0 bg-[#070a10] text-slate-100 flex flex-col items-center justify-between p-6 overflow-hidden">
              {/* Clean Titanium Studio Grid Backdrop */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b18_1px,transparent_1px),linear-gradient(to_bottom,#1e293b18_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />
              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[340px] h-[340px] bg-cyan-950/25 rounded-full blur-3xl pointer-events-none" />

              {/* Top Studio Telemetry Badge */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-widest border border-cyan-800/60 bg-slate-900/90 text-cyan-300 mt-3 z-10 shadow-sm"
              >
                <Activity size={14} className="text-cyan-400 animate-pulse" />
                <span>STUDIO MONITOR // 96kHz 24-BIT LOSSLESS</span>
              </motion.div>

              {/* Center Hero: Studio Oscilloscope & Acoustic Calibration */}
              <div className="flex flex-col items-center justify-center my-auto z-10 w-full max-w-sm">
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                  className="relative mb-5 w-full flex flex-col items-center"
                >
                  {/* Oscilloscope Monitor Chassis */}
                  <div className="w-64 sm:w-72 bg-slate-950/90 border border-slate-700/80 rounded-2xl p-4 shadow-[0_12px_30px_rgba(0,0,0,0.7)] relative overflow-hidden">
                    {/* Screen Grid Lines */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d410_1px,transparent_1px),linear-gradient(to_bottom,#06b6d410_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
                    
                    {/* Top Monitor Info Bar */}
                    <div className="flex items-center justify-between text-[9px] font-mono text-cyan-400/80 mb-3 border-b border-slate-800 pb-1.5">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        CALIBRATED
                      </span>
                      <span>FREQ: 20Hz - 20kHz</span>
                      <span>0.00 dB</span>
                    </div>

                    {/* Oscilloscope Display Body */}
                    <div className="flex items-center justify-between gap-3 relative py-1">
                      {/* Left VU Channel */}
                      <div className="flex flex-col gap-1 w-2.5">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <div key={i} className={`h-1.5 rounded-xs ${i > 4 ? 'bg-amber-400' : 'bg-cyan-400'}`} />
                        ))}
                      </div>

                      {/* Center Circular Aperture with Logo */}
                      <div className="relative mx-auto">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-slate-900 border-2 border-cyan-500/70 p-1.5 shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center overflow-hidden">
                          {renderLogo()}
                        </div>
                        {/* Crosshair ticks */}
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-[8px] font-mono text-cyan-400">+3dB</div>
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-mono text-cyan-400">-12dB</div>
                      </div>

                      {/* Right VU Channel */}
                      <div className="flex flex-col gap-1 w-2.5">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <div key={i} className={`h-1.5 rounded-xs ${i > 4 ? 'bg-amber-400' : 'bg-cyan-400'}`} />
                        ))}
                      </div>
                    </div>

                    {/* Bottom Waveform Sine SVG */}
                    <div className="w-full h-6 mt-3 border-t border-slate-800 pt-1 flex items-center overflow-hidden">
                      <svg className="w-full h-full text-cyan-400 stroke-current opacity-80" viewBox="0 0 100 20" fill="none" preserveAspectRatio="none">
                        <path d="M 0 10 Q 12.5 0, 25 10 T 50 10 T 75 10 T 100 10" strokeWidth="1.5" />
                      </svg>
                    </div>
                  </div>
                </motion.div>

                {/* Typography */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                  className="text-center"
                >
                  <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-[0.25em] text-slate-100 drop-shadow-sm">
                    JGFMUSIC
                  </h1>
                  <p className="mt-1.5 text-xs font-mono font-bold uppercase tracking-widest text-cyan-400">
                    STUDIO REFERENCE • BIT-PERFECT SOUND
                  </p>
                </motion.div>
              </div>

              {/* Bottom Progress Bar & Button */}
              <div className="w-full max-w-sm flex flex-col items-center mb-6 z-10">
                <div className="w-full flex items-center justify-between text-xs font-mono font-bold uppercase mb-2 px-1 text-cyan-300">
                  <span className="truncate flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    {statusMessages[statusIndex]}
                  </span>
                  <span>{Math.round(progress)}%</span>
                </div>
                {/* Precision Segmented Telemetry Progress Bar */}
                <div className="w-full h-3 rounded-lg overflow-hidden p-0.5 border border-slate-700 bg-slate-950">
                  <div
                    className="h-full rounded-sm bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 transition-all shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <button
                  id="splash-proceed-btn"
                  onClick={handleProceed}
                  className="mt-5 w-full py-3.5 px-6 rounded-xl font-mono font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 border border-cyan-500/60 transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)] bg-slate-900 hover:bg-slate-800 text-cyan-300 cursor-pointer active:scale-98"
                >
                  <Sliders size={15} className="text-cyan-400" />
                  <span>{progress >= 100 ? 'START ENGINE // READY' : 'PROCEED TO STUDIO'}</span>
                  <ArrowRight size={16} className="stroke-[3]" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
