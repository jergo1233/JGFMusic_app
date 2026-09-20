let wakeLockSentinel = null;
let primedAudioContext = null;

// Helper to calculate the next occurrence timestamp for any schedule (Daily, Weekdays, or Once)
export const getNextScheduleDate = (sched) => {
  const now = new Date();
  const [h, m] = (sched.time || '00:00').split(':').map(Number);
  const currentTs = now.getTime();

  if (sched.repeat === 'daily') {
    let target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
    if (target.getTime() <= currentTs) {
      target.setDate(target.getDate() + 1);
    }
    return target;
  }

  if (sched.repeat === 'weekdays') {
    let target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
    if (target.getTime() <= currentTs) {
      target.setDate(target.getDate() + 1);
    }
    while (target.getDay() === 0 || target.getDay() === 6) {
      target.setDate(target.getDate() + 1);
    }
    return target;
  }

  // Once / Specific date
  if (sched.date) {
    const parts = sched.date.split('-').map(Number);
    let target = new Date(parts[0], parts[1] - 1, parts[2], h, m, 0, 0);
    // If the scheduled time has passed and auto-renew / reusable is active, push to next valid occurrence
    if (target.getTime() <= currentTs && (sched.autoRenew || sched.reusable)) {
      let nextTarget = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
      if (nextTarget.getTime() <= currentTs) {
        nextTarget.setDate(nextTarget.getDate() + 1);
      }
      return nextTarget;
    }
    return target;
  }

  let defaultTarget = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
  if (defaultTarget.getTime() <= currentTs) {
    defaultTarget.setDate(defaultTarget.getDate() + 1);
  }
  return defaultTarget;
};

export const schedulerService = {
  // Prime browser AudioContext on user interaction so autoplay works in background/standby
  primeAudioKeepAlive() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        if (!primedAudioContext) {
          primedAudioContext = new AudioCtx();
        }
        if (primedAudioContext.state === 'suspended') {
          primedAudioContext.resume();
        }
        // Play an imperceptible silent 0.01s buffer to authorize audio playback
        const buffer = primedAudioContext.createBuffer(1, 1, 22050);
        const source = primedAudioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(primedAudioContext.destination);
        source.start(0);
      }
    } catch (e) {
      console.warn('Audio prime keepalive note:', e);
    }
  },

  async requestPermissions() {
    this.primeAudioKeepAlive();
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

  // Calculate next date string (YYYY-MM-DD) for 1-tap re-use
  calculateReusableDate(timeStr) {
    const now = new Date();
    const [h, m] = (timeStr || '00:00').split(':').map(Number);
    const targetToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);

    const target = targetToday.getTime() > now.getTime() ? targetToday : new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const y = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, '0');
    const d = String(target.getDate()).padStart(2, '0');
    return `${y}-${month}-${d}`;
  },

  async syncWithServiceWorker(schedules = []) {
    try {
      this.primeAudioKeepAlive();
      if ('serviceWorker' in navigator) {
        const payload = {
          type: 'SYNC_SCHEDULES',
          schedules: schedules.map(s => ({
            ...s,
            // Attach computed next trigger timestamp for Service Worker accuracy
            nextTriggerTimestamp: getNextScheduleDate(s).getTime()
          }))
        };

        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.active) {
          registration.active.postMessage(payload);
        } else if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage(payload);
        }
      }
    } catch (e) {
      console.warn('Could not sync schedules with service worker:', e);
    }
  },

  async schedulePlayback(scheduleItem, allSchedules = []) {
    this.primeAudioKeepAlive();
    await this.requestWakeLock();

    const schedulesList = allSchedules.length > 0 ? allSchedules : [scheduleItem];
    await this.syncWithServiceWorker(schedulesList);

    // If notification permission is granted, prepare direct local timeout as backup
    if ('Notification' in window && Notification.permission === 'granted') {
      const nextDate = getNextScheduleDate(scheduleItem);
      const delay = nextDate.getTime() - Date.now();
      if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
        setTimeout(() => {
          try {
            new Notification(`⏰ ALARM: ${scheduleItem.title}`, {
              body: `Time for music: "${scheduleItem.title}". Tap to start playing.`,
              icon: '/icon.svg',
              tag: `alarm_${scheduleItem.id}`,
              renotify: true
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

/* JGFMusic v1.0.2 */
