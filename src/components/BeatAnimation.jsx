import React from 'react';

const BeatAnimation = ({ isPlaying }) => {
  if (!isPlaying) return null;
  return (
    <div className="flex items-end justify-center space-x-1 h-6 w-8">
      <div className="w-1.5 h-full bg-indigo-600 dark:bg-indigo-50 rounded-t-sm eq-bar eq-1" />
      <div className="w-1.5 h-full bg-indigo-600 dark:bg-indigo-50 rounded-t-sm eq-bar eq-2" />
      <div className="w-1.5 h-full bg-indigo-600 dark:bg-indigo-50 rounded-t-sm eq-bar eq-3" />
      <div className="w-1.5 h-full bg-indigo-600 dark:bg-indigo-50 rounded-t-sm eq-bar eq-4" />
    </div>
  );
};

export default BeatAnimation;
