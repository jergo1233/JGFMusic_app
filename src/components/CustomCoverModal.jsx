import React, { useState } from 'react';
import { Image, Upload, Check, X, RotateCcw, Sparkles } from 'lucide-react';
import { fileService } from '../services/fileService';
import CdDisc from './CdDisc';

const COVER_PRESETS = [
  {
    name: 'Cyberpunk Neon',
    url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80'
  },
  {
    name: 'Electric Club Beats',
    url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80'
  },
  {
    name: 'Retro Turntable',
    url: 'https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=500&auto=format&fit=crop&q=80'
  },
  {
    name: 'Sunset Acoustic',
    url: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=500&auto=format&fit=crop&q=80'
  },
  {
    name: 'Midnight Jazz',
    url: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=500&auto=format&fit=crop&q=80'
  },
  {
    name: 'Vibrant Soundwave',
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80'
  }
];

const CustomCoverModal = ({ isOpen, song, onClose, onSaveCover }) => {
  const [selectedArtwork, setSelectedArtwork] = useState(song?.artworkUri || null);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen || !song) return null;

  const handlePickCustomFile = async () => {
    try {
      setIsUploading(true);
      const file = await fileService.pickImageFile();
      if (file) {
        const savedUri = await fileService.saveFileToPrivateStorage(file, `cover_${song.id}_${Date.now()}.jpg`);
        const objectUrl = await fileService.getFileUrl(savedUri);
        setSelectedArtwork(objectUrl || savedUri);
      }
    } catch (err) {
      console.warn('Error picking image file:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleApply = async () => {
    await onSaveCover(song.id, selectedArtwork);
    onClose();
  };

  const handleResetToDisc = () => {
    setSelectedArtwork(null);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-indigo-50 dark:bg-slate-900 text-indigo-950 dark:text-indigo-50 max-border rounded-3xl max-shadow max-w-md w-full p-6 space-y-5 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-indigo-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center max-border">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight text-indigo-950 dark:text-white">Custom Music Cover</h3>
              <p className="text-xs font-black text-indigo-700 dark:text-amber-300 uppercase truncate max-w-[220px]">
                {song.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Live Artwork Preview */}
        <div className="flex flex-col items-center">
          <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700 dark:text-amber-300 mb-2">
            COVER PREVIEW
          </span>
          <div className="w-36 h-36 rounded-2xl max-border shadow-lg overflow-hidden relative flex items-center justify-center bg-slate-950">
            {selectedArtwork ? (
              <img
                src={selectedArtwork}
                alt="Custom Cover Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <CdDisc isPlaying={true} compact={false} title={song.title} artist={song.artist} className="w-full h-full" />
            )}
            <span className="absolute bottom-2 px-2 py-0.5 rounded bg-black/70 text-[9px] font-black uppercase text-amber-300 border border-white/20">
              {selectedArtwork ? 'CUSTOM' : 'VINYL DISC'}
            </span>
          </div>
        </div>

        {/* Upload Button */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handlePickCustomFile}
            disabled={isUploading}
            className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase rounded-xl max-border flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Upload size={18} />
            <span>{isUploading ? 'LOADING...' : 'UPLOAD PHOTO'}</span>
          </button>
          <button
            type="button"
            onClick={handleResetToDisc}
            title="Reset to CD Disc visual"
            className="py-3 px-3 bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 text-indigo-950 dark:text-indigo-100 font-black text-xs uppercase rounded-xl max-border flex items-center justify-center gap-1 cursor-pointer"
          >
            <RotateCcw size={16} />
            <span>RESET</span>
          </button>
        </div>

        {/* Preset Covers Grid */}
        <div>
          <span className="block text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-amber-300 mb-2">
            OR CHOOSE A COVER PRESET:
          </span>
          <div className="grid grid-cols-3 gap-2.5 max-h-36 overflow-y-auto p-1">
            {COVER_PRESETS.map((preset, idx) => {
              const isChosen = selectedArtwork === preset.url;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedArtwork(preset.url)}
                  className={`aspect-square rounded-xl overflow-hidden relative max-border cursor-pointer transition-all hover:scale-105 ${
                    isChosen ? 'border-amber-400 ring-2 ring-amber-400' : 'opacity-80 hover:opacity-100'
                  }`}
                  title={preset.name}
                >
                  <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                  {isChosen && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Check size={20} className="text-amber-400 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base uppercase rounded-xl max-border shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
          >
            <Check size={20} className="stroke-[3]" />
            <span>SAVE COVER</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3.5 bg-gray-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-black text-base uppercase rounded-xl max-border cursor-pointer hover:bg-gray-300 dark:hover:bg-slate-700 transition-colors"
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomCoverModal;

/* JGFMusic v1.0.2 */
