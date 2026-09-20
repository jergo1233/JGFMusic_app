let wakeLockSentinel = null;

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

  async requestWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        if (!wakeLockSentinel) {
          wakeLockSentinel = await navigator.wakeLock.request('screen');
          wakeLockSentinel.addEventListener('release', () => {
            wakeLockSentinel = null;
          });
        }
        return true;
      } catch (err) {
        console.warn('Wake Lock request ignored or failed:', err);
        return false;
      }
    }
    return false;
  },

  releaseWakeLock() {
    if (wakeLockSentinel) {
      try {
        wakeLockSentinel.release();
      } catch (e) {}
      wakeLockSentinel = null;
    }
  },

  async syncWithServiceWorker(schedules = []) {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.active) {
          registration.active.postMessage({
            type: 'SYNC_SCHEDULES',
            schedules
          });
        } else if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SYNC_SCHEDULES',
            schedules
          });
        }
      }
    } catch (e) {
      console.warn('Could not sync schedules with service worker:', e);
    }
  },

  async schedulePlayback(scheduleItem, allSchedules = []) {
    // Sync to Service Worker for background alarm notifications
    const schedulesList = allSchedules.length > 0 ? allSchedules : [scheduleItem];
    await this.syncWithServiceWorker(schedulesList);

    // If notification permission is granted, prepare direct local timeout as backup
    if ('Notification' in window && Notification.permission === 'granted') {
      const dateStr = `${scheduleItem.date}T${scheduleItem.time}:00`;
      const scheduleDate = new Date(dateStr);
      const delay = scheduleDate.getTime() - Date.now();
      if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
        setTimeout(() => {
          try {
            new Notification('⏰ JGFMusic Scheduled Alarm', {
              body: `Oras na: "${scheduleItem.title}". I-tap para magpatugtog.`,
              icon: '/icon.svg'
            });
          } catch (err) {
            console.warn('Direct notification error:', err);
          }
        }, delay);
      }
    }
  },

  async cancelSchedule(idStr, remainingSchedules = []) {
    await this.syncWithServiceWorker(remainingSchedules);
  }
};

