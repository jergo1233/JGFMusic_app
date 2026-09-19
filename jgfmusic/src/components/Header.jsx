import React, { useState, useEffect } from 'react';
import { Music4 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Header = () => {
  const { logoUrl } = useTheme();
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [logoUrl]);

  const handleLogoClick = () => {
    window.dispatchEvent(new CustomEvent('jgf:replay-splash'));
  };

  const activeLogoSrc = logoUrl || '/icon.svg';

  return (
    <div className="flex items-center space-x-3 select-none">
      <button
        type="button"
        onClick={handleLogoClick}
        title="JGFMusic (Tap to replay splash intro)"
        className="bg-indigo-600 text-white dark:bg-indigo-50 dark:text-indigo-950 max-border rounded-full max-shadow transform -rotate-3 overflow-hidden w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center p-0.5 hover:rotate-0 transition-transform active:scale-95 shadow-md cursor-pointer"
      >
        {!imgError ? (
          <img 
            src={activeLogoSrc} 
            alt="JGFMusic Logo" 
            onError={() => setImgError(true)}
            className="w-full h-full object-cover rounded-full" 
          />
        ) : (
          <Music4 size={26} className="stroke-[3]" />
        )}
      </button>
      <div>
        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 dark:from-purple-400 dark:to-orange-400 drop-shadow-sm">
          JGFMusic
        </h1>
      </div>
    </div>
  );
};

export default Header;
