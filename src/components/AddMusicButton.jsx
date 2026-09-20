import React, { useState } from 'react';
import { fileService } from '../services/fileService';
import { useLibrary } from '../context/LibraryContext';
import { Plus, AlertTriangle, CheckCircle2, X } from 'lucide-react';

const AddMusicButton = () => {
  const { addMusic } = useLibrary();
  const [duplicateModal, setDuplicateModal] = useState({
    isOpen: false,
    addedCount: 0,
    duplicates: []
  });

  const handleAddMusic = async () => {
    try {
      const files = await fileService.pickAudioFiles();
      if (files && files.length > 0) {
        const result = await addMusic(files);
        if (result && result.duplicates && result.duplicates.length > 0) {
          setDuplicateModal({
            isOpen: true,
            addedCount: result.addedCount || 0,
            duplicates: result.duplicates
          });
        }
      }
    } catch (e) {
      console.error(e);
      alert("Unable to access files.");
    }
  };

  return (
    <>
      <button 
        id="add-music-library-btn"
        onClick={handleAddMusic}
        className="flex items-center justify-center gap-1.5 sm:gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-50 dark:hover:bg-white text-white dark:text-indigo-950 px-4 sm:px-5 py-4 font-black uppercase text-sm sm:text-base max-border rounded-2xl max-shadow hover:translate-y-0.5 hover:translate-x-0.5 transition-all shrink-0 cursor-pointer shadow-md active:scale-95"
        title="Add Music from your device"
      >
        <Plus size={22} className="stroke-[3]" />
        <span>ADD</span>
      </button>

      {/* Duplicate Song Blocked Notification Modal */}
      {duplicateModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 max-border rounded-3xl max-shadow p-6 w-full max-w-md relative animate-scaleUp">
            <button
              onClick={() => setDuplicateModal({ isOpen: false, addedCount: 0, duplicates: [] })}
              className="absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-full transition-colors cursor-pointer"
              title="Close"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center max-border shrink-0 shadow-sm">
                <AlertTriangle size={24} className="stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                  Existing Song Detected
                </h3>
                <p className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  {duplicateModal.addedCount > 0 ? 'PARTIALLY ADDED' : 'DUPLICATES NOT ALLOWED'}
                </p>
              </div>
            </div>

            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 leading-relaxed">
              {duplicateModal.addedCount > 0 ? (
                <>
                  Successfully added <span className="text-emerald-700 dark:text-emerald-400 font-black">{duplicateModal.addedCount} new songs</span>. However, the following tracks <span className="text-amber-700 dark:text-amber-400 font-black">already exist in your library</span> and duplicates were skipped:
                </>
              ) : (
                <>
                  Addition skipped because the selected tracks <span className="text-amber-700 dark:text-amber-400 font-black">already exist in your Music Library</span>:
                </>
              )}
            </p>

            {/* List of blocked duplicate songs */}
            <div className="max-h-40 overflow-y-auto rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-3 max-border mb-5 space-y-1.5">
              {duplicateModal.duplicates.map((title, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs font-black uppercase text-slate-800 dark:text-slate-200">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span className="truncate">{title}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setDuplicateModal({ isOpen: false, addedCount: 0, duplicates: [] })}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-wide rounded-2xl max-border shadow-md active:scale-95 transition-all text-sm cursor-pointer"
            >
              NAINTINDIHAN KO (OK)
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AddMusicButton;

/* JGFMusic v1.0.2 */
