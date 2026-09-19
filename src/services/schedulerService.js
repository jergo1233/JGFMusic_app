export const schedulerService = {
  async requestPermissions() {
    if ('Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        return res === 'granted';
      } catch (e) {
        return false;
      }
    }
    return true;
  },

  async schedulePlayback(scheduleItem) {
    // In-app scheduler handles playback via interval in PlayerContext
    if ('Notification' in window && Notification.permission === 'granted') {
      const dateStr = `${scheduleItem.date}T${scheduleItem.time}`;
      const scheduleDate = new Date(dateStr);
      const delay = scheduleDate.getTime() - Date.now();
      if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
        setTimeout(() => {
          new Notification('JGFMusic - Scheduled Playback', {
            body: `Playing: ${scheduleItem.title}`,
            icon: '/icon.svg'
          });
        }, delay);
      }
    }
  },

  async cancelSchedule(idStr) {
    // Handled in storage
  }
};
