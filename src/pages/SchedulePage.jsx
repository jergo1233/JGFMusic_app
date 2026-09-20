import React, { useState, useEffect } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';
import { schedulerService } from '../services/schedulerService';
import { Trash2, Plus, Clock, Calendar, Music, ListMusic, Check, AlertCircle, Play, RotateCcw, Repeat, ShieldCheck, Zap } from 'lucide-react';
import { generateId } from '../utils/format';
import { useLocation } from 'react-router-dom';

const SchedulePage = () => {
  const { schedules, saveSchedules, songs, playlists } = useLibrary();
  const { playScheduledItem } = usePlayer();
  const location = useLocation();

  const [showForm, setShowForm] = useState(false);
  const [targetId, setTargetId] = useState('');
  const [type, setType] = useState('song');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [repeat, setRepeat] = useState('daily'); // 'daily', 'weekdays', 'once'
  const [autoRenew, setAutoRenew] = useState(true); // Reusable auto-renewal
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const getTodayStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const getTimeWithOffset = (addMinutes = 5) => {
    const d = new Date(Date.now() + addMinutes * 60 * 1000);
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${min}`;
  };

  const openScheduleForm = () => {
    setDate(getTodayStr());
    setTime(getTimeWithOffset(5));
    setRepeat('daily');
    setAutoRenew(true);
    setErrorMessage('');
    
    if (!targetId) {
      if (type === 'song' && songs.length > 0) setTargetId(songs[0].id);
      else if (type === 'playlist' && playlists.length > 0) setTargetId(playlists[0].id);
    }
    setShowForm(true);
  };

  useEffect(() => {
    if (location.state?.prefillTargetId) {
      setTargetId(location.state.prefillTargetId);
      setType(location.state.prefillType || 'song');
      setDate(getTodayStr());
      setTime(getTimeWithOffset(5));
      setRepeat('daily');
      setAutoRenew(true);
      setShowForm(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleTypeChange = (newType) => {
    setType(newType);
    setErrorMessage('');
    if (newType === 'song') {
      setTargetId(songs.length > 0 ? songs[0].id : '');
    } else {
      setTargetId(playlists.length > 0 ? playlists[0].id : '');
    }
  };

  const handleApplyPreset = (minutes) => {
    setTime(getTimeWithOffset(minutes));
    setDate(getTodayStr());
    setErrorMessage('');
  };

  const handleSchedule = async () => {
    setErrorMessage('');
    let resolvedTargetId = targetId;
    if (!resolvedTargetId) {
      if (type === 'song' && songs.length > 0) {
        resolvedTargetId = songs[0].id;
        setTargetId(songs[0].id);
      } else if (type === 'playlist' && playlists.length > 0) {
        resolvedTargetId = playlists[0].id;
        setTargetId(playlists[0].id);
      } else {
        setErrorMessage(`Pumili muna ng ${type === 'song' ? 'kanta' : 'playlist'}.`);
        return;
      }
    }

    let finalDate = date || getTodayStr();
    let finalTime = time || getTimeWithOffset(5);

    setIsSaving(true);
    try {
      try {
        await schedulerService.requestPermissions();
        schedulerService.primeAudioKeepAlive();
      } catch (err) {
        console.warn('Notification permission skipped:', err);
      }

      let title = 'Unknown Track';
      if (type === 'song') {
        const found = songs.find(s => s.id === resolvedTargetId);
        title = found?.title || 'Scheduled Song';
      } else {
        const found = playlists.find(p => p.id === resolvedTargetId);
        title = found?.name || 'Scheduled Playlist';
      }

      const newSched = {
        id: generateId(),
        targetId: resolvedTargetId,
        type,
        title,
        date: finalDate,
        time: finalTime,
        repeat, // 'daily', 'weekdays', 'once'
        autoRenew, // Reusable: kusa ulit tutugtog sa susunod na araw
        reusable: true, // Permanent reusable entry
        enabled: true,
        createdAt: Date.now()
      };

      const updated = [newSched, ...schedules];
      await schedulerService.schedulePlayback(newSched, updated);
      await saveSchedules(updated);

      setShowForm(false);
      const repeatLabel = repeat === 'daily' ? 'Araw-araw (Daily)' : repeat === 'weekdays' ? 'Lunes-Biyernes (Weekdays)' : 'Isang beses (Reusable)';
      setSuccessMessage(`Nai-save! "${title}" naka-schedule tuwing ${finalTime} (${repeatLabel}). Reusable at mag-a-auto-play kahit sarado ang screen o offline!`);
      setTimeout(() => setSuccessMessage(''), 7000);
    } catch (e) {
      console.error('Failed to schedule:', e);
      setErrorMessage('Hindi nai-save ang schedule.');
    } finally {
      setIsSaving(false);
    }
  };

  // 1-Tap REUSE / RE-ARM ACTION: Allows using the same song schedule anytime without re-typing
  const handleReuseSchedule = async (sched) => {
    const nextDate = schedulerService.calculateReusableDate(sched.time);
    const updated = schedules.map(s => {
      if (s.id === sched.id) {
        return {
          ...s,
          date: nextDate,
          enabled: true,
          status: 'active'
        };
      }
      return s;
    });
    await saveSchedules(updated);
    await schedulerService.syncWithServiceWorker(updated);
    schedulerService.primeAudioKeepAlive();
    setSuccessMessage(`Nai-rearm si "${sched.title}" para sa ${sched.time} (${nextDate})! Reusable ito.`);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const toggleScheduleEnabled = async (id) => {
    const updated = schedules.map(s => {
      if (s.id === id) {
        const nextEnabled = !s.enabled;
        return { ...s, enabled: nextEnabled };
      }
      return s;
    });
    await saveSchedules(updated);
    await schedulerService.syncWithServiceWorker(updated);
    if (updated.some(s => s.enabled)) {
      schedulerService.primeAudioKeepAlive();
    }
  };

  const deleteSchedule = async (id) => {
    const updated = schedules.filter(s => s.id !== id);
    await saveSchedules(updated);
    await schedulerService.cancelSchedule(id, updated);
  };

  const handleTestPlay = (sched) => {
    if (playScheduledItem) {
      playScheduledItem(sched, true);
      setSuccessMessage(`Sinusubukan ang musika: "${sched.title}"!`);
      setTimeout(() => setSuccessMessage(''), 3500);
    }
  };

  return (
    <div className="pb-56 sm:pb-64 px-4 max-w-2xl mx-auto min-h-screen select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white max-border flex items-center justify-center shadow-sm">
            <Clock size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-indigo-950 dark:text-white">
              Schedules
            </h2>
            <p className="text-xs font-black text-indigo-700 dark:text-amber-300 uppercase tracking-wider">
              REUSABLE AUTO-PLAY TIMERS ({schedules.length})
            </p>
          </div>
        </div>

        {!showForm && (
          <button
            onClick={openScheduleForm}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase rounded-xl max-border shadow-sm cursor-pointer active:scale-95"
          >
            <Plus size={16} className="stroke-[3]" />
            <span>BAGONG SCHEDULE</span>
          </button>
        )}
      </div>

      {successMessage && (
        <div className="bg-emerald-500/15 border-2 border-emerald-500 text-emerald-800 dark:text-emerald-300 p-4 rounded-2xl flex items-center gap-3 mb-6 shadow-md">
          <Check size={22} className="stroke-[3] flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="font-black text-xs sm:text-sm uppercase tracking-wide">{successMessage}</span>
        </div>
      )}

      {/* Auto-Play, Background & Offline Assurance Banner */}
      <div className="mb-6 p-4.5 rounded-2xl bg-gradient-to-r from-amber-400/15 to-indigo-500/10 dark:from-amber-400/10 dark:to-indigo-500/10 border-2 border-amber-400/40 text-indigo-950 dark:text-amber-100 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
            <Zap size={18} className="stroke-[3]" />
          </div>
          <div className="text-xs leading-relaxed space-y-1">
            <p className="font-black uppercase tracking-wider text-slate-900 dark:text-amber-300">
              Reusable • Close Screen • 100% Offline Alarm
            </p>
            <p className="text-gray-700 dark:text-gray-300 font-medium">
              • <strong>Reusable Songs:</strong> Hindi mawawala ang iyong mga naka-schedule na kanta. Pwede mong pindutin ang <strong>REUSE 🔄</strong> anumang oras o itakda bilang <strong>Araw-araw (Daily)</strong>.<br />
              • <strong>Kahit sarado ang screen:</strong> Gamit ang background audio keepalive at WakeLock, tutunog at mag-play ang musika kahit naka-lock ang cellphone.<br />
              • <strong>Offline Ready:</strong> Nakatago ang mga kanta sa IndexedDB at Service Worker cache kaya tutunog pa rin kahit walang Wi-Fi o data!
            </p>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="bg-indigo-100 dark:bg-slate-800 p-5 sm:p-6 max-border rounded-3xl max-shadow mb-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-indigo-200 dark:border-slate-700 pb-3">
            <h3 className="font-black text-xl uppercase tracking-tight text-indigo-950 dark:text-white flex items-center gap-2">
              <Clock size={20} className="text-indigo-600 dark:text-indigo-400" />
              <span>MAG-SCHEDULE NG KANTA</span>
            </h3>
          </div>

          <div className="flex bg-indigo-200/70 dark:bg-slate-900 p-1.5 rounded-2xl max-border">
            <button
              type="button"
              onClick={() => handleTypeChange('song')}
              className={`flex-1 py-2 rounded-xl font-black text-xs sm:text-sm uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                type === 'song' ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-900 dark:text-indigo-200'
              }`}
            >
              <Music size={16} />
              <span>KANTA</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('playlist')}
              className={`flex-1 py-2 rounded-xl font-black text-xs sm:text-sm uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                type === 'playlist' ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-900 dark:text-indigo-200'
              }`}
            >
              <ListMusic size={16} />
              <span>PLAYLIST</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-amber-300 mb-1.5">
              PUMILI NG {type === 'song' ? 'KANTA' : 'PLAYLIST'}
            </label>
            <select
              value={targetId}
              onChange={e => {
                setTargetId(e.target.value);
                setErrorMessage('');
              }}
              className="w-full bg-white dark:bg-slate-900 text-slate-950 dark:text-white p-3.5 max-border rounded-xl outline-none font-bold text-sm uppercase cursor-pointer"
            >
              <option value="">-- PUMILI NG {type.toUpperCase()} --</option>
              {type === 'song' ? (
                songs.map(s => <option key={s.id} value={s.id}>{s.title} - {s.artist}</option>)
              ) : (
                playlists.map(p => <option key={p.id} value={p.id}>{p.name} ({p.songIds?.length || 0} songs)</option>)
              )}
            </select>
          </div>

          {/* Repeat / Reusable Options */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-amber-300 mb-1.5 flex items-center gap-1.5">
              <Repeat size={14} className="text-indigo-600 dark:text-amber-400" />
              <span>REUSABLE REPEAT MODE (DALAS NG PAGTUGTOG)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRepeat('daily')}
                className={`py-2.5 px-2 rounded-xl font-black text-[11px] sm:text-xs uppercase max-border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  repeat === 'daily'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-900 text-indigo-950 dark:text-slate-200'
                }`}
              >
                <span>🔄 ARAW-ARAW</span>
                <span className="text-[9px] opacity-80">(Daily)</span>
              </button>
              <button
                type="button"
                onClick={() => setRepeat('weekdays')}
                className={`py-2.5 px-2 rounded-xl font-black text-[11px] sm:text-xs uppercase max-border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  repeat === 'weekdays'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-900 text-indigo-950 dark:text-slate-200'
                }`}
              >
                <span>📅 WEEKDAYS</span>
                <span className="text-[9px] opacity-80">(Mon - Fri)</span>
              </button>
              <button
                type="button"
                onClick={() => setRepeat('once')}
                className={`py-2.5 px-2 rounded-xl font-black text-[11px] sm:text-xs uppercase max-border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  repeat === 'once'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-900 text-indigo-950 dark:text-slate-200'
                }`}
              >
                <span>⏰ ISANG BESES</span>
                <span className="text-[9px] opacity-80">(Reusable)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-amber-300 mb-1 flex items-center gap-1">
                <Calendar size={14} className="text-indigo-600 dark:text-amber-400" />
                <span>PETSA (DATE)</span>
              </label>
              <input
                type="date"
                value={date}
                min={getTodayStr()}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 text-slate-950 dark:text-white p-3 max-border rounded-xl font-bold text-sm uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-amber-300 mb-1 flex items-center gap-1">
                <Clock size={14} className="text-indigo-600 dark:text-amber-400" />
                <span>ORAS (TIME)</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 text-slate-950 dark:text-white p-3 max-border rounded-xl font-bold text-sm uppercase"
              />
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="flex flex-wrap gap-2 pt-1 items-center">
            <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-amber-300">Preset:</span>
            {[5, 15, 30, 60].map(mins => (
              <button
                key={mins}
                type="button"
                onClick={() => handleApplyPreset(mins)}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-black text-[10px] uppercase border border-indigo-300 dark:border-slate-600 shadow-sm cursor-pointer"
              >
                +{mins}m
              </button>
            ))}
          </div>

          {/* Auto-Renew Switch */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-indigo-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <RotateCcw size={16} className="text-indigo-600 dark:text-amber-400" />
              <div>
                <p className="text-xs font-black uppercase text-indigo-950 dark:text-white">
                  Awtomatikong Ulitin (Auto-Renew)
                </p>
                <p className="text-[10px] text-gray-600 dark:text-gray-400">
                  Mananatiling reusable at muling mag-a-alarm bukas
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoRenew}
              onChange={e => setAutoRenew(e.target.checked)}
              className="w-5 h-5 accent-indigo-600 cursor-pointer"
            />
          </div>

          {errorMessage && (
            <div className="bg-red-500/15 border-2 border-red-500 text-red-700 dark:text-red-300 p-3 rounded-xl flex items-center gap-2 text-xs font-black uppercase">
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              id="schedule-save-btn"
              disabled={isSaving}
              onClick={handleSchedule}
              className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base uppercase rounded-xl max-border shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Check size={20} className="stroke-[3]" />
              <span>{isSaving ? 'ISINASAVE...' : 'I-SAVE ANG SCHEDULE'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-3.5 bg-slate-200 dark:bg-slate-700 text-slate-950 dark:text-white font-black text-base uppercase rounded-xl max-border cursor-pointer hover:bg-slate-300"
            >
              KANSELAHIN
            </button>
          </div>
        </div>
      )}

      {/* Schedules List */}
      <div className="space-y-3.5">
        {schedules.map(sched => {
          const isDaily = sched.repeat === 'daily';
          const isWeekdays = sched.repeat === 'weekdays';
          const isOnce = sched.repeat === 'once' || !sched.repeat;

          return (
            <div
              key={sched.id}
              className={`p-4 max-border rounded-2xl max-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${
                sched.enabled ? 'bg-indigo-50 dark:bg-slate-800' : 'bg-slate-100 dark:bg-slate-900 opacity-80'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-11 h-11 rounded-xl max-border bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  {sched.type === 'playlist' ? <ListMusic size={22} /> : <Music size={22} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="font-black text-base uppercase truncate text-indigo-950 dark:text-indigo-50">
                      {sched.title}
                    </h4>
                    {/* Recurrence & Reusable Badges */}
                    {isDaily && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40">
                        🔄 Araw-araw (Daily)
                      </span>
                    )}
                    {isWeekdays && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-800 dark:text-sky-300 border border-sky-500/40">
                        📅 Weekdays
                      </span>
                    )}
                    {isOnce && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-800 dark:text-purple-300 border border-purple-500/40">
                        ⏰ Reusable
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-400">
                    <span>{sched.date}</span>
                    <span>•</span>
                    <span className="font-mono text-indigo-600 dark:text-amber-400 font-black text-sm">
                      {sched.time}
                    </span>
                    <span>•</span>
                    <span className={sched.enabled ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-gray-500'}>
                      {sched.enabled ? 'ARMED / ACTIVE' : 'STANDBY'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: 1-Tap REUSE, Play Test, Toggle, Delete */}
              <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap justify-end">
                {/* 1-Tap REUSE / ULITIN Button */}
                <button
                  type="button"
                  onClick={() => handleReuseSchedule(sched)}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black uppercase rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
                  title="Ulitin / Re-arm Schedule para sa susunod na oras"
                >
                  <RotateCcw size={13} className="stroke-[2.5]" />
                  <span>REUSE</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTestPlay(sched)}
                  className="px-2.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black uppercase rounded-xl flex items-center gap-1 cursor-pointer active:scale-95 shadow-sm"
                  title="Pakinggan agad"
                >
                  <Play size={12} fill="currentColor" />
                  <span>PLAY</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleScheduleEnabled(sched.id)}
                  className={`px-3 py-2 rounded-xl text-[11px] font-black uppercase cursor-pointer transition-all shadow-sm ${
                    sched.enabled ? 'bg-indigo-950 dark:bg-indigo-500 text-white' : 'bg-amber-400 text-slate-950 font-black'
                  }`}
                >
                  {sched.enabled ? 'ON' : 'OFF'}
                </button>

                <button
                  type="button"
                  onClick={() => deleteSchedule(sched.id)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl cursor-pointer transition-colors"
                  title="Tanggalin sa listahan"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}

        {schedules.length === 0 && !showForm && (
          <div className="text-center py-16 px-4 bg-indigo-50/50 dark:bg-slate-800/40 max-border rounded-3xl">
            <Clock size={48} className="mx-auto text-indigo-700 dark:text-indigo-300 mb-3 stroke-[2]" />
            <p className="font-black text-2xl text-indigo-950 dark:text-white uppercase tracking-widest">
              WALANG SCHEDULE!
            </p>
            <p className="text-xs font-black text-indigo-700 dark:text-amber-300 uppercase mt-1">
              Magtakda ng mga reusable timer para awtomatikong tumugtog ang musika.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchedulePage;

/* JGFMusic v1.0.2 */
