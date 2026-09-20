import React from 'react';
import { useTheme } from '../context/ThemeContext';

const Background = () => {
  const { bgUrl } = useTheme();

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-indigo-50 dark:bg-slate-900 transition-colors duration-300">
      {bgUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-85 dark:opacity-75 animate-pan"
          style={{ backgroundImage: `url(${bgUrl})` }}
        />
      ) : (
        <div className="absolute inset-0 opacity-10 dark:opacity-20 bg-[radial-gradient(circle_at_center,_currentColor_2px,_transparent_2px)] [background-size:30px_30px] animate-slide text-indigo-950 dark:text-indigo-50" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/5 to-indigo-50/40 dark:from-slate-900/10 dark:to-slate-900/60 pointer-events-none" />
    </div>
  );
};

export default Background;

/* JGFMusic v1.0.2 */
