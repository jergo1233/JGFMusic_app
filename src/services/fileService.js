import { set, get, del } from 'idb-keyval';

export const fileService = {
  async pickImageFile() {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
          resolve(file);
        } else {
          resolve(null);
        }
      };
      input.click();
    });
  },

  async pickAudioFiles() {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac,.opus,.weba';
      input.multiple = true;
      input.onchange = (e) => {
        const files = Array.from(e.target.files || []);
        resolve(files);
      };
      input.click();
    });
  },

  isAudioFile(file) {
    if (!file) return false;
    const name = file.name || '';
    const isAudioType = file.type && file.type.startsWith('audio/');
    const hasAudioExt = /\.(mp3|wav|m4a|aac|ogg|flac|opus|weba|wma)$/i.test(name);
    return isAudioType || hasAudioExt;
  },

  async readAllFilesFromDirectoryHandle(dirHandle) {
    const audioFiles = [];
    const self = this;
    async function walk(handle, relativePath = '') {
      try {
        for await (const entry of handle.values()) {
          if (entry.kind === 'file') {
            try {
              const file = await entry.getFile();
              if (self.isAudioFile(file)) {
                try {
                  Object.defineProperty(file, 'webkitRelativePath', {
                    value: `${relativePath}${handle.name}/${file.name}`,
                    writable: true
                  });
                } catch (e) {}
                audioFiles.push(file);
              }
            } catch (err) {}
          } else if (entry.kind === 'directory') {
            try {
              await walk(entry, `${relativePath}${handle.name}/`);
            } catch (err) {}
          }
        }
      } catch (err) {}
    }
    await walk(dirHandle);
    return audioFiles;
  },

  async autoScanAudio() {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      // Targets all audio formats without directory navigation
      input.accept = 'audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac,.opus,.weba';
      input.multiple = true;
      
      let resolved = false;
      input.onchange = (e) => {
        if (resolved) return;
        resolved = true;
        const allFiles = Array.from(e.target.files || []);
        const audioFiles = allFiles.filter(f => this.isAudioFile(f));
        resolve(audioFiles);
      };

      input.oncancel = () => {
        if (resolved) return;
        resolved = true;
        resolve([]);
      };

      input.click();
    });
  },

  async pickAudioFolder() {
    // If showDirectoryPicker is supported in the browser context, try it first
    if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
      try {
        const dirHandle = await window.showDirectoryPicker();
        if (dirHandle) {
          const files = await this.readAllFilesFromDirectoryHandle(dirHandle);
          if (files && files.length > 0) {
            return files;
          }
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          return [];
        }
        console.warn("showDirectoryPicker fallback to input:", err);
      }
    }

    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.webkitdirectory = true;
      input.directory = true;
      input.multiple = true;

      let resolved = false;
      input.onchange = (e) => {
        if (resolved) return;
        resolved = true;
        const allFiles = Array.from(e.target.files || []);
        const audioFiles = allFiles.filter(f => this.isAudioFile(f));
        resolve(audioFiles);
      };

      input.oncancel = () => {
        if (resolved) return;
        resolved = true;
        resolve([]);
      };

      input.click();
    });
  },

  async pickAudioFiles() {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac,.opus,.weba,.m4b,.wma';
      input.multiple = true;

      let resolved = false;
      input.onchange = (e) => {
        if (resolved) return;
        resolved = true;
        const allFiles = Array.from(e.target.files || []);
        const audioFiles = allFiles.filter(f => this.isAudioFile(f));
        resolve(audioFiles);
      };

      input.oncancel = () => {
        if (resolved) return;
        resolved = true;
        resolve([]);
      };

      input.click();
    });
  },

  async saveFileToPrivateStorage(fileObj, fileName) {
    const uniqueName = `${Date.now()}_${fileName || 'file'}`;
    await set(uniqueName, fileObj);
    return `idb://${uniqueName}`;
  },

  async getFileUrl(fileUri) {
    if (!fileUri) return null;
    try {
      if (fileUri.startsWith('idb://')) {
        const key = fileUri.replace('idb://', '');
        const blob = await get(key);
        if (blob) {
          return URL.createObjectURL(blob);
        }
      }
      return fileUri;
    } catch (e) {
      console.warn("Failed to get file URL:", e);
      return null;
    }
  },

  async deleteFile(fileUri) {
    if (fileUri && fileUri.startsWith('idb://')) {
      const key = fileUri.replace('idb://', '');
      await del(key);
    }
  },

  async exportFile(fileUri, destinationName) {
    const url = await this.getFileUrl(fileUri);
    if (!url) throw new Error('File not available');
    const a = document.createElement('a');
    a.href = url;
    a.download = destinationName || 'track.mp3';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  }
};

/* JGFMusic v1.0.2 */
