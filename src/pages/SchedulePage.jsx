import React, { useState, useEffect } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';
import { schedulerService } from '../services/schedulerService';
import { Trash2, Plus, Clock, Calendar, Music, ListMusic, Check, AlertCircle, Play, Repeat, Edit2, X } from 'lucide-react';
import { generateId } from '../utils/format';
import { useLocation } from 'react-router-dom';

const SchedulePage = () => {
  const { schedules, saveSchedules, songs, playlists } = useLibrary();
  const { playScheduledItem } = usePlayer();
  const location = useLocation();

  const [showForm, setShowForm] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState(null);
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
    setEditingScheduleId(null);
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

  const handleEditSchedule = (sched) => {
    setEditingScheduleId(sched.id);
    setType(sched.type || 'song');
    setTargetId(sched.targetId);
    setDate(sched.date || getTodayStr());
    setTime(sched.time || getTimeWithOffset(5));
    setRepeat(sched.repeat || 'daily');
    setAutoRenew(sched.autoRenew !== false);
    setErrorMessage('');
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
        setErrorMessage(`Please select a ${type === 'song' ? 'song' : 'playlist'} first.`);
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

      let updated = [];
      let savedSched = null;

      if (editingScheduleId) {
        const existing = schedules.find(s => s.id === editingScheduleId);
        savedSched = {
          ...existing,
          id: editingScheduleId,
          targetId: resolvedTargetId,
          type,
          title,
          date: finalDate,
          time: finalTime,
          repeat, // 'daily', 'weekdays', 'once'
          autoRenew, // Reusable: automatically re-arms for next day
          reusable: true,
          enabled: true,
          status: 'active',
          updatedAt: Date.now()
        };
        updated = schedules.map(s => (s.id === editingScheduleId ? savedSched : s));
      } else {
        savedSched = {
          id: generateId(),
          targetId: resolvedTargetId,
          type,
          title,
          date: finalDate,
          time: finalTime,
          repeat, // 'daily', 'weekdays', 'once'
          autoRenew, // Reusable: automatically re-arms for next day
          reusable: true, // Permanent reusable entry
          enabled: true,
          status: 'active',
          createdAt: Date.now()
        };
        updated = [savedSched, ...schedules];
      }

      await schedulerService.schedulePlayback(savedSched, updated);
      await saveSchedules(updated);

      setShowForm(false);
      setEditingScheduleId(null);
      const repeatLabel = repeat === 'daily' ? 'Daily (Every day)' : repeat === 'weekdays' ? 'Weekdays (Mon - Fri)' : 'Once (Reusable)';
      if (editingScheduleId) {
        setSuccessMessage(`Schedule updated! "${title}" time set to ${finalTime} (${repeatLabel}). Reusable alarm is active!`);
      } else {
        setSuccessMessage(`Schedule saved! "${title}" set for ${finalTime} (${repeatLabel}). Reusable alarm is active!`);
      }
      setTimeout(() => setSuccessMessage(''), 7000);
    } catch (e) {
      console.error('Failed to schedule:', e);
      setErrorMessage('Failed to save schedule. Please check your time settings.');
    } finally {
      setIsSaving(false);
    }
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
    if (editingScheduleId === id) {
      setEditingScheduleId(null);
      setShowForm(false);
    }
    const updated = schedules.filter(s => s.id !== id);
    await saveSchedules(updated);
    await schedulerService.cancelSchedule(id, updated);
  };

  const handleTestPlay = (sched) => {
    if (playScheduledItem) {
      // Trigger full alarm test (plays song, boosts volume, activates vibration & phone alarm screen)
      playScheduledItem(sched, false);
      setSuccessMessage(`Alarm ringing test: "${sched.title}"!`);
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
              Alarm & Schedules
            </h2>
            <p className="text-xs font-black text-indigo-700 dark:text-amber-300 uppercase tracking-wider">
              AUTO-PLAY ALARMS ({schedules.length}) • PLAYS EVEN IN SLEEP MODE ⏰
            </p>
          </div>
        </div>

        <button
          onClick={openScheduleForm}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none text-slate-950 font-black text-xs sm:text-sm uppercase rounded-xl border-3 border-indigo-950 dark:border-white shadow-[4px_4px_0px_#1e1b4b] dark:shadow-[4px_4px_0px_#fff] cursor-pointer transition-all"
        >
          <Plus size={18} className="stroke-[3]" />
          <span>NEW ALARM</span>
        </button>
      </div>

      {successMessage && (
        <div className="bg-emerald-500/20 border-3 border-emerald-600 text-emerald-950 dark:text-emerald-200 p-4 rounded-2xl flex items-center gap-3 mb-6 shadow-[4px_4px_0px_#1e1b4b] dark:shadow-[4px_4px_0px_#fff]">
          <Check size={22} className="stroke-[3] flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="font-black text-xs sm:text-sm uppercase tracking-wide">{successMessage}</span>
        </div>
      )}

      {/* POPUP OVERLAY MODAL FOR EDITING / CREATING SCHEDULE */}
      {showForm && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowForm(false);
              setEditingScheduleId(null);
            }
          }}
        >
          <div className="w-full max-w-lg bg-indigo-50 dark:bg-slate-900 border-4 border-indigo-950 dark:border-indigo-300 rounded-3xl shadow-[8px_8px_0px_#1e1b4b] dark:shadow-[8px_8px_0px_#c7d2fe] p-5 sm:p-6 relative my-auto space-y-4 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b-3 border-indigo-950 dark:border-indigo-300 pb-3">
              <h3 className="font-black text-lg sm:text-xl uppercase tracking-tight text-indigo-950 dark:text-white flex items-center gap-2">
                {editingScheduleId ? (
                  <>
                    <Edit2 size={22} className="text-amber-500 stroke-[2.5]" />
                    <span>EDIT ALARM TIME</span>
                  </>
                ) : (
                  <>
                    <Clock size={22} className="text-indigo-600 dark:text-amber-400 stroke-[2.5]" />
                    <span>NEW MUSIC ALARM</span>
                  </>
                )}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingScheduleId(null);
                }}
                className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 text-indigo-950 dark:text-white border-2 border-indigo-950 dark:border-indigo-300 shadow-[2px_2px_0px_#1e1b4b] dark:shadow-[2px_2px_0px_#c7d2fe] flex items-center justify-center hover:bg-rose-500 hover:text-white hover:border-black active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                title="Close popup"
              >
                <X size={18} className="stroke-[3]" />
              </button>
            </div>

            {editingScheduleId && (
              <div className="p-3 bg-amber-400/25 border-2 border-amber-500/60 rounded-xl text-xs font-black text-amber-950 dark:text-amber-200 flex items-center gap-2 shadow-[2px_2px_0px_#1e1b4b]">
                <Edit2 size={15} className="text-amber-600 dark:text-amber-400 shrink-0 stroke-[2.5]" />
                <span>Baguhin ang oras, kanta, o repeat mode sa ibaba.</span>
              </div>
            )}

            {/* Type Selector (Song vs Playlist) - Maximalist Style */}
            <div className="flex bg-indigo-200/80 dark:bg-slate-950 p-1.5 rounded-2xl border-3 border-indigo-950 dark:border-indigo-300 shadow-[3px_3px_0px_#1e1b4b] dark:shadow-[3px_3px_0px_#c7d2fe]">
              <button
                type="button"
                onClick={() => handleTypeChange('song')}
                className={`flex-1 py-2.5 rounded-xl font-black text-xs sm:text-sm uppercase transition-all flex items-center justify-center gap-2 cursor-pointer border-2 ${
                  type === 'song'
                    ? 'bg-amber-400 text-slate-950 border-indigo-950 shadow-[2px_2px_0px_#1e1b4b]'
                    : 'border-transparent text-indigo-950 dark:text-indigo-200 hover:bg-white/40'
                }`}
              >
                <Music size={16} className="stroke-[2.5]" />
                <span>SONG</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('playlist')}
                className={`flex-1 py-2.5 rounded-xl font-black text-xs sm:text-sm uppercase transition-all flex items-center justify-center gap-2 cursor-pointer border-2 ${
                  type === 'playlist'
                    ? 'bg-amber-400 text-slate-950 border-indigo-950 shadow-[2px_2px_0px_#1e1b4b]'
                    : 'border-transparent text-indigo-950 dark:text-indigo-200 hover:bg-white/40'
                }`}
              >
                <ListMusic size={16} className="stroke-[2.5]" />
                <span>PLAYLIST</span>
              </button>
            </div>

            {/* Select Target */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-indigo-950 dark:text-amber-300 mb-1.5">
                SELECT {type === 'song' ? 'SONG' : 'PLAYLIST'}
              </label>
              <select
                value={targetId}
                onChange={e => {
                  setTargetId(e.target.value);
                  setErrorMessage('');
                }}
                className="w-full bg-white dark:bg-slate-950 text-slate-950 dark:text-white p-3 border-3 border-indigo-950 dark:border-indigo-300 rounded-xl shadow-[3px_3px_0px_#1e1b4b] dark:shadow-[3px_3px_0px_#c7d2fe] outline-none font-black text-xs sm:text-sm uppercase cursor-pointer"
              >
                <option value="">-- SELECT {type.toUpperCase()} --</option>
                {type === 'song' ? (
                  songs.map(s => <option key={s.id} value={s.id}>{s.title} - {s.artist}</option>)
                ) : (
                  playlists.map(p => <option key={p.id} value={p.id}>{p.name} ({p.songIds?.length || 0} songs)</option>)
                )}
              </select>
            </div>

            {/* Repeat Mode - Maximalist Buttons */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-indigo-950 dark:text-amber-300 mb-1.5 flex items-center gap-1.5">
                <Repeat size={14} className="text-indigo-600 dark:text-amber-400 stroke-[2.5]" />
                <span>REPEAT MODE (FREQUENCY)</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRepeat('daily')}
                  className={`py-2.5 px-2 rounded-xl font-black text-[11px] sm:text-xs uppercase border-2 border-indigo-950 dark:border-indigo-300 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer active:translate-x-0.5 active:translate-y-0.5 ${
                    repeat === 'daily'
                      ? 'bg-emerald-500 text-slate-950 shadow-[3px_3px_0px_#1e1b4b] dark:shadow-[3px_3px_0px_#c7d2fe]'
                      : 'bg-white dark:bg-slate-800 text-indigo-950 dark:text-slate-200 hover:bg-emerald-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>🔄 DAILY</span>
                  <span className="text-[9px] opacity-80 font-bold">(Every day)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRepeat('weekdays')}
                  className={`py-2.5 px-2 rounded-xl font-black text-[11px] sm:text-xs uppercase border-2 border-indigo-950 dark:border-indigo-300 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer active:translate-x-0.5 active:translate-y-0.5 ${
                    repeat === 'weekdays'
                      ? 'bg-sky-400 text-slate-950 shadow-[3px_3px_0px_#1e1b4b] dark:shadow-[3px_3px_0px_#c7d2fe]'
                      : 'bg-white dark:bg-slate-800 text-indigo-950 dark:text-slate-200 hover:bg-sky-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>📅 WEEKDAYS</span>
                  <span className="text-[9px] opacity-80 font-bold">(Mon - Fri)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRepeat('once')}
                  className={`py-2.5 px-2 rounded-xl font-black text-[11px] sm:text-xs uppercase border-2 border-indigo-950 dark:border-indigo-300 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer active:translate-x-0.5 active:translate-y-0.5 ${
                    repeat === 'once'
                      ? 'bg-purple-400 text-slate-950 shadow-[3px_3px_0px_#1e1b4b] dark:shadow-[3px_3px_0px_#c7d2fe]'
                      : 'bg-white dark:bg-slate-800 text-indigo-950 dark:text-slate-200 hover:bg-purple-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>⏰ ONCE</span>
                  <span className="text-[9px] opacity-80 font-bold">(One-time)</span>
                </button>
              </div>
            </div>

            {/* Date and Time Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-indigo-950 dark:text-amber-300 mb-1 flex items-center gap-1">
                  <Calendar size={14} className="text-indigo-600 dark:text-amber-400 stroke-[2.5]" />
                  <span>DATE</span>
                </label>
                <input
                  type="date"
                  value={date}
                  min={getTodayStr()}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 text-slate-950 dark:text-white p-3 border-3 border-indigo-950 dark:border-indigo-300 rounded-xl shadow-[3px_3px_0px_#1e1b4b] dark:shadow-[3px_3px_0px_#c7d2fe] font-black text-sm uppercase outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-indigo-950 dark:text-amber-300 mb-1 flex items-center gap-1">
                  <Clock size={14} className="text-indigo-600 dark:text-amber-400 stroke-[2.5]" />
                  <span>TIME (ALARM TIME)</span>
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 text-slate-950 dark:text-white p-3 border-3 border-indigo-950 dark:border-indigo-300 rounded-xl shadow-[3px_3px_0px_#1e1b4b] dark:shadow-[3px_3px_0px_#c7d2fe] font-black text-sm uppercase font-mono outline-none"
                />
              </div>
            </div>

            {/* Quick Presets - Maximalist Chips */}
            <div className="flex flex-wrap gap-2 pt-1 items-center">
              <span className="text-[11px] font-black uppercase text-indigo-950 dark:text-amber-300">Quick Presets:</span>
              {[5, 15, 30, 60].map(mins => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => handleApplyPreset(mins)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-indigo-950 dark:text-white font-black text-[11px] uppercase border-2 border-indigo-950 dark:border-indigo-300 shadow-[2px_2px_0px_#1e1b4b] dark:shadow-[2px_2px_0px_#c7d2fe] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer hover:bg-amber-300 hover:text-slate-950 transition-all"
                >
                  +{mins}M
                </button>
              ))}
            </div>

            {/* Auto-Renew Switch Container */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-950 border-3 border-indigo-950 dark:border-indigo-300 shadow-[3px_3px_0px_#1e1b4b] dark:shadow-[3px_3px_0px_#c7d2fe]">
              <div className="flex items-center gap-2">
                <Repeat size={18} className="text-indigo-600 dark:text-amber-400 stroke-[2.5]" />
                <div>
                  <p className="text-xs font-black uppercase text-indigo-950 dark:text-white">
                    Automatic Repeat (Auto-Renew)
                  </p>
                  <p className="text-[10px] font-bold text-gray-600 dark:text-gray-400">
                    Awtomatikong mag-re-arm sa susunod na araw
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
              <div className="bg-rose-500/20 border-3 border-rose-500 text-rose-800 dark:text-rose-200 p-3 rounded-xl flex items-center gap-2 text-xs font-black uppercase shadow-[2px_2px_0px_#1e1b4b]">
                <AlertCircle size={18} className="stroke-[2.5] text-rose-600 dark:text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Modal Footer Buttons - Maximalism Style */}
            <div className="flex gap-3 pt-2">
              <button
                id="schedule-save-btn"
                disabled={isSaving}
                onClick={handleSchedule}
                className="flex-1 py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 active:translate-x-1 active:translate-y-1 active:shadow-none text-slate-950 font-black text-sm sm:text-base uppercase rounded-2xl border-3 border-indigo-950 dark:border-white shadow-[4px_4px_0px_#1e1b4b] dark:shadow-[4px_4px_0px_#fff] flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Check size={20} className="stroke-[3]" />
                <span>{isSaving ? 'SAVING...' : editingScheduleId ? 'UPDATE ALARM TIME' : 'SAVE ALARM'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingScheduleId(null);
                }}
                className="px-5 py-3.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 active:translate-x-1 active:translate-y-1 active:shadow-none text-slate-950 dark:text-white font-black text-sm sm:text-base uppercase rounded-2xl border-3 border-indigo-950 dark:border-white shadow-[4px_4px_0px_#1e1b4b] dark:shadow-[4px_4px_0px_#fff] cursor-pointer transition-all"
              >
                CANCEL
              </button>
            </div>
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
                        🔄 Daily
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
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-400 flex-wrap">
                    <span>{sched.date}</span>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => handleEditSchedule(sched)}
                      className="flex items-center gap-1.5 font-mono text-slate-950 dark:text-white font-black text-sm bg-amber-400/90 hover:bg-amber-300 dark:bg-amber-500/30 dark:hover:bg-amber-500/50 px-2.5 py-1 rounded-xl transition-all cursor-pointer border-2 border-indigo-950 dark:border-indigo-300 shadow-[2px_2px_0px_#1e1b4b] dark:shadow-[2px_2px_0px_#c7d2fe] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                      title="Click to edit time set in popup"
                    >
                      <Clock size={13} className="stroke-[2.5]" />
                      <span>{sched.time}</span>
                      <Edit2 size={11} className="ml-0.5 stroke-[2.5]" />
                    </button>
                    <span>•</span>
                    <span className={sched.enabled ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-gray-500'}>
                      {sched.enabled ? 'ARMED / ACTIVE' : 'STANDBY'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons in Maximalism Style: EDIT, PLAY TEST, ON/OFF TOGGLE, DELETE */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
                {/* EDIT BUTTON */}
                <button
                  type="button"
                  onClick={() => handleEditSchedule(sched)}
                  className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none text-slate-950 text-xs font-black uppercase rounded-xl border-2 border-indigo-950 dark:border-white shadow-[3px_3px_0px_#1e1b4b] dark:shadow-[3px_3px_0px_#fff] flex items-center gap-1.5 cursor-pointer transition-all"
                  title="Edit alarm settings in popup"
                >
                  <Edit2 size={14} className="stroke-[2.5]" />
                  <span>EDIT</span>
                </button>

                {/* PLAY BUTTON */}
                <button
                  type="button"
                  onClick={() => handleTestPlay(sched)}
                  className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none text-slate-950 text-xs font-black uppercase rounded-xl border-2 border-indigo-950 dark:border-white shadow-[3px_3px_0px_#1e1b4b] dark:shadow-[3px_3px_0px_#fff] flex items-center gap-1.5 cursor-pointer transition-all"
                  title="Test alarm ringing now"
                >
                  <Play size={13} fill="currentColor" />
                  <span>PLAY</span>
                </button>

                {/* ON / OFF TOGGLE */}
                <button
                  type="button"
                  onClick={() => toggleScheduleEnabled(sched.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase cursor-pointer border-2 border-indigo-950 dark:border-white shadow-[3px_3px_0px_#1e1b4b] dark:shadow-[3px_3px_0px_#fff] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all ${
                    sched.enabled 
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white' 
                      : 'bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-slate-300 hover:bg-slate-400'
                  }`}
                  title={sched.enabled ? 'Turn Alarm OFF' : 'Turn Alarm ON'}
                >
                  {sched.enabled ? 'ON' : 'OFF'}
                </button>

                {/* DELETE BUTTON */}
                <button
                  type="button"
                  onClick={() => deleteSchedule(sched.id)}
                  className="p-2 bg-rose-500 hover:bg-rose-600 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none text-white rounded-xl border-2 border-indigo-950 dark:border-white shadow-[3px_3px_0px_#1e1b4b] dark:shadow-[3px_3px_0px_#fff] cursor-pointer transition-all"
                  title="Delete schedule"
                >
                  <Trash2 size={16} className="stroke-[2.5]" />
                </button>
              </div>
            </div>
          );
        })}

        {schedules.length === 0 && (
          <div className="text-center py-16 px-4 bg-indigo-50/50 dark:bg-slate-800/40 max-border rounded-3xl">
            <Clock size={48} className="mx-auto text-indigo-700 dark:text-indigo-300 mb-3 stroke-[2]" />
            <p className="font-black text-2xl text-indigo-950 dark:text-white uppercase tracking-widest">
              NO SCHEDULES SET!
            </p>
            <p className="text-xs font-black text-indigo-700 dark:text-amber-300 uppercase mt-1 mb-5">
              Set reusable timers to automatically play music at your chosen time.
            </p>
            <button
              onClick={openScheduleForm}
              className="inline-flex items-center gap-2 px-5 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm uppercase rounded-2xl border-3 border-indigo-950 dark:border-white shadow-[4px_4px_0px_#1e1b4b] dark:shadow-[4px_4px_0px_#fff] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-all"
            >
              <Plus size={18} className="stroke-[3]" />
              <span>CREATE FIRST ALARM</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchedulePage;

/* JGFMusic v1.0.2 */
