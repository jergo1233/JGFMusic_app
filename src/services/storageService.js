export const storageService = {
  async get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      if (item === null || item === undefined) return defaultValue;
      return JSON.parse(item);
    } catch (e) {
      console.warn(`storageService.get error for ${key}:`, e);
      return defaultValue;
    }
  },

  async set(key, value) {
    try {
      const stringValue = JSON.stringify(value);
      localStorage.setItem(key, stringValue);
    } catch (e) {
      console.warn(`storageService.set error for ${key}:`, e);
    }
  },

  async remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`storageService.remove error for ${key}:`, e);
    }
  }
};
