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

  async saveFileToPrivateStorage(fileObj, fileName) {
    const uniqueName = `${Date.now()}_${fileName || 'file'}`;
    await set(uniqueName, fileObj);
    return `idb://${uniqueName}`;
  },

  async getFileUrl(fileUri) {
    if (!fileUri) return null;
    if (fileUri.startsWith('idb://')) {
      const key = fileUri.replace('idb://', '');
      const blob = await get(key);
      if (blob) {
        return URL.createObjectURL(blob);
      }
    }
    return fileUri;
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
