import React, { useState, useEffect } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { schedulerService } from '../services/schedulerService';
import { 
  Scan, 
  CheckCircle2, 
  Loader2, 
  Music, 
  AlertCircle, 
  FolderOpen, 
  FileAudio, 
  X, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { fileService } from '../services/fileService';

const AddMusicButton = ({ 
  label = "IMPORT MUSIC", 
  sublabel = "",
  className = "", 
  id = "add-music-library-btn",
  showIcon = true,
  icon: CustomIcon = null,
  mode = "menu", // 'menu', 'folder', 'files', 'scan'
  onSuccess = null
}) => {
  const { addMusic } = useLibrary();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [toast, setToast] = useState(null);
  const [showPickerModal, setShowPickerModal] = useState(false);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const processFiles = async (files, sourceLabel = "File Manager") => {
    if (!files || files.length === 0) {
      return;
    }

    schedulerService.primeAudioKeepAlive();
    setIsProcessing(true);
    setStatusText(`Importing ${files.length} audio file${files.length === 1 ? '' : 's'}...`);

    try {
      const result = await addMusic(files);
      if (onSuccess) {
        onSuccess(result);
      }

      if (result?.addedCount > 0) {
        setToast({
          type: 'success',
          message: `${result.addedCount} new song${result.addedCount === 1 ? '' : 's'} added to your library!`,
          sub: result.duplicates?.length > 0 ? `(${result.duplicates.length} duplicate tracks skipped)` : `Source: ${sourceLabel}`
        });
      } else if (result?.duplicates?.length > 0) {
        setToast({
          type: 'info',
          message: 'All selected tracks are already in your library.',
          sub: `${result.duplicates.length} duplicate track${result.duplicates.length === 1 ? '' : 's'} skipped`
        });
      } else {
        setToast({
          type: 'info',
          message: 'No valid audio tracks found.',
          sub: 'Please select .mp3, .wav, .m4a, or .flac files'
        });
      }
    } catch (e) {
      console.error("Failed to import music:", e);
      setToast({
        type: 'info',
        message: 'Could not process audio files.',
        sub: 'Please try again.'
      });
    } finally {
      setIsProcessing(false);
      setStatusText('');
    }
  };

  const handleSelectFolder = async () => {
    setShowPickerModal(false);
    setIsProcessing(true);
    setStatusText('Opening Folder Picker...');
    try {
      const files = await fileService.pickAudioFolder();
      await processFiles(files, "Selected Folder");
    } catch (err) {
      console.error("Folder picker error:", err);
    } finally {
      setIsProcessing(false);
      setStatusText('');
    }
  };

  const handleManualSelectSongs = async () => {
    setShowPickerModal(false);
    setIsProcessing(true);
    setStatusText('Opening File Manager...');
    try {
      const files = await fileService.pickAudioFiles();
      await processFiles(files, "Manual Selection");
    } catch (err) {
      console.error("Manual file picker error:", err);
    } finally {
      setIsProcessing(false);
      setStatusText('');
    }
  };

  const handleQuickScan = async () => {
    setShowPickerModal(false);
    setIsProcessing(true);
    setStatusText('Scanning Audio Files...');
    try {
      const files = await fileService.autoScanAudio();
      await processFiles(files, "Audio Scan");
    } catch (err) {
      console.error("Quick scan error:", err);
    } finally {
      setIsProcessing(false);
      setStatusText('');
    }
  };

  const handleClick = (e) => {
    e.preventDefault();
    if (isProcessing) return;

    if (mode === 'folder') {
      handleSelectFolder();
    } else if (mode === 'files') {
      handleManualSelectSongs();
    } else if (mode === 'scan') {
      handleQuickScan();
    } else {
      setShowPickerModal(true);
    }
  };

  const defaultClasses = "flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-slate-950 px-4 sm:px-6 py-3.5 sm:py-4 font-black uppercase text-xs sm:text-sm max-border rounded-2xl max-shadow hover:translate-y-0.5 hover:translate-x-0.5 transition-all shrink-0 cursor-pointer shadow-md active:scale-95 whitespace-nowrap";

  const IconComponent = CustomIcon || Scan;

  return (
    <>
      <button 
        id={id}
        type="button"
        disabled={isProcessing}
        onClick={handleClick}
        className={className || defaultClasses}
        title="Add or import audio from File Manager"
      >
        {isProcessing ? (
          <Loader2 size={20} className="animate-spin shrink-0 text-white dark:text-slate-950" />
        ) : showIcon ? (
          <IconComponent size={20} className="stroke-[2.8] shrink-0" />
        ) : null}
        <div className="flex flex-col text-left leading-tight">
          <span>{isProcessing ? (statusText || "SCANNING AUDIO...") : label}</span>
          {sublabel && !isProcessing && (
            <span className="text-[10px] font-bold normal-case opacity-90 mt-0.5">
              {sublabel}
            </span>
          )}
        </div>
      </button>

      {/* Music Source Selection Modal */}
      {showPickerModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowPickerModal(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 max-border rounded-3xl max-shadow p-5 sm:p-6 w-full max-w-md relative animate-scaleUp text-slate-950 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b-2 border-indigo-100 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center max-border shadow-sm">
                  <FileAudio size={20} className="stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                    Add Music
                  </h3>
                  <p className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-amber-300">
                    CHOOSE FILE MANAGER SOURCE
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPickerModal(false)}
                className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-full transition-colors cursor-pointer"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-4">
              Select how you would like to load audio files from your device:
            </p>

            {/* Options List */}
            <div className="space-y-3 mb-4">
              {/* Option 1: Select Entire Folder */}
              <button
                type="button"
                id="select-folder-option-btn"
                onClick={handleSelectFolder}
                className="w-full p-4 rounded-2xl max-border bg-indigo-50/80 hover:bg-indigo-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-left transition-all flex items-center justify-between gap-3 cursor-pointer group active:scale-98 shadow-sm"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 max-border flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <FolderOpen size={24} className="stroke-[2.5]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm sm:text-base font-black uppercase tracking-tight text-slate-900 dark:text-white">
                        Select Music Folder
                      </h4>
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-400/30 text-amber-800 dark:text-amber-300 border border-amber-400/50">
                        FOLDER
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-snug mt-0.5">
                      Pick a whole folder. Scans all songs and keeps folder categories.
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-amber-400 shrink-0" />
              </button>

              {/* Option 2: Manual Select Songs */}
              <button
                type="button"
                id="manual-select-songs-option-btn"
                onClick={handleManualSelectSongs}
                className="w-full p-4 rounded-2xl max-border bg-indigo-50/80 hover:bg-indigo-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-left transition-all flex items-center justify-between gap-3 cursor-pointer group active:scale-98 shadow-sm"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white max-border flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <Music size={24} className="stroke-[2.5]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm sm:text-base font-black uppercase tracking-tight text-slate-900 dark:text-white">
                        Manual Select Songs
                      </h4>
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 border border-indigo-600/40">
                        FILES
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-snug mt-0.5">
                      Manually select individual tracks or multiple audio files from File Manager.
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-amber-400 shrink-0" />
              </button>

              {/* Option 3: Quick Audio Scan */}
              <button
                type="button"
                id="quick-audio-scan-option-btn"
                onClick={handleQuickScan}
                className="w-full p-4 rounded-2xl max-border bg-indigo-50/80 hover:bg-indigo-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-left transition-all flex items-center justify-between gap-3 cursor-pointer group active:scale-98 shadow-sm"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 max-border flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <Scan size={24} className="stroke-[2.5]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm sm:text-base font-black uppercase tracking-tight text-slate-900 dark:text-white">
                        Quick Audio Scan
                      </h4>
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40">
                        ALL MP3
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-snug mt-0.5">
                      Instantly opens your device audio picker to select any MP3/WAV/M4A tracks.
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-400 group-hover:text-emerald-600 shrink-0" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowPickerModal(false)}
              className="w-full py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-black uppercase tracking-wide rounded-xl max-border active:scale-98 transition-all text-xs cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Instant Notification Toast */}
      {toast && (
        <div 
          onClick={() => setToast(null)}
          className="fixed top-5 left-1/2 -translate-x-1/2 z-[80] max-w-md w-[calc(100%-2rem)] bg-slate-950 text-white p-3.5 rounded-2xl max-border shadow-2xl flex items-center gap-3 animate-fadeIn cursor-pointer"
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-slate-950'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 size={20} className="stroke-[2.5]" />
            ) : (
              <AlertCircle size={20} className="stroke-[2.5]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-black uppercase tracking-tight text-white truncate">
              {toast.message}
            </p>
            {toast.sub && (
              <p className="text-[11px] font-bold text-slate-400 truncate">
                {toast.sub}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AddMusicButton;

/* JGFMusic v1.0.2 */
