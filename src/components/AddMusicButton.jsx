import React from 'react';
import { fileService } from '../services/fileService';
import { useLibrary } from '../context/LibraryContext';
import { Plus } from 'lucide-react';

const AddMusicButton = () => {
  const { addMusic } = useLibrary();

  const handleAddMusic = async () => {
    try {
      const files = await fileService.pickAudioFiles();
      if (files && files.length > 0) {
        await addMusic(files);
      }
    } catch (e) {
      alert("Could not pick files.");
    }
  };

  return (
    <button 
      id="add-music-library-btn"
      onClick={handleAddMusic}
      className="flex items-center justify-center gap-1.5 sm:gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-50 dark:hover:bg-white text-white dark:text-indigo-950 px-4 sm:px-5 py-4 font-black uppercase text-sm sm:text-base max-border rounded-2xl max-shadow hover:translate-y-0.5 hover:translate-x-0.5 transition-all shrink-0 cursor-pointer shadow-md active:scale-95"
      title="Add Music from your device (Magdagdag ng kanta)"
    >
      <Plus size={22} className="stroke-[3]" />
      <span>ADD</span>
    </button>
  );
};

export default AddMusicButton;
