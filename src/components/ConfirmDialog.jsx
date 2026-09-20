import React from 'react';

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-indigo-50 dark:bg-slate-800 max-border rounded-3xl max-shadow p-8 w-full max-w-sm">
        <h3 className="text-3xl font-black mb-4 text-indigo-950 dark:text-indigo-50 uppercase tracking-tight drop-shadow-[2px_2px_0_#c7d2fe] dark:drop-shadow-[2px_2px_0_#312e81]">{title}</h3>
        <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 mb-8 uppercase leading-tight">{message}</p>
        <div className="flex gap-4">
          <button 
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 max-border rounded-xl font-black text-lg sm:text-xl uppercase bg-slate-200 dark:bg-slate-700 text-slate-950 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors cursor-pointer"
          >
            CANCEL
          </button>
          <button 
            type="button"
            onClick={onConfirm}
            className="flex-1 px-4 py-3 max-border rounded-xl font-black text-xl uppercase bg-indigo-600 text-white dark:bg-indigo-50 dark:text-indigo-950 hover:bg-red-600 dark:hover:bg-red-500 transition-colors cursor-pointer shadow-md"
          >
            CONFIRM
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
