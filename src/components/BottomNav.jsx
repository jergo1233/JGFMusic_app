import React from 'react';
import { Library, PlaySquare, History, Clock, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const BottomNav = () => {
  const location = useLocation();

  const navItems = [
    { path: '/library', icon: Library, label: 'Library' },
    { path: '/playlists', icon: PlaySquare, label: 'Playlists' },
    { path: '/history', icon: History, label: 'History' },
    { path: '/scheduled', icon: Clock, label: 'Schedules' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-indigo-50/95 dark:bg-slate-900/95 backdrop-blur-2xl border-t-2 border-indigo-900/15 dark:border-indigo-200/15 pb-safe z-40 select-none shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="flex justify-around items-center h-16 sm:h-18 max-w-2xl mx-auto px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path === '/library' && location.pathname === '/');
          return (
            <Link
              key={item.path}
              id={`nav-link-${item.label.toLowerCase()}`}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full font-black uppercase tracking-wider transition-all select-none py-1 ${
                isActive
                  ? 'text-indigo-700 dark:text-amber-300 scale-105 drop-shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:text-indigo-950 dark:hover:text-white active:scale-95'
              }`}
            >
              <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-indigo-600/10 dark:bg-amber-400/10' : ''}`}>
                <Icon size={21} className={isActive ? 'stroke-[2.8]' : 'stroke-[2.2]'} />
              </div>
              <span className="text-[10px] sm:text-[11px] font-black leading-tight mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
