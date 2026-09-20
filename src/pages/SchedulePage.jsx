import React, { useState, useEffect } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { usePlayer } from '../context/PlayerContext';
import { schedulerService } from '../services/schedulerService';
import { Trash2, Plus, Clock, Calendar, Music, ListMusic, Check, AlertCircle, Play } from 'lucide-react';
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
        setErrorMessage(`Please add or choose a ${type === 'song' ? 'song' : 'playlist'} first.`);
        return;
      }
    }

    let finalDate = date || getTodayStr();
    let finalTime = time || getTimeWithOffset(5);

    setIsSaving(true);
    try {
      try {
        await schedulerService.requestPermissions();
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
        enabled: true,
        createdAt: Date.now()
      };

      const updated = [newSched, ...schedules];
      await schedulerService.schedulePlayback(newSched, updated);
      await saveSchedules(updated);

      setShowForm(false);
      setSuccessMessage(`Saved! Naka-schedule ang "${title}" sa ${finalDate} nang ${finalTime}. Tuloy ang play kahit naka-standby o naka-off ang screen!`);
      setTimeout(() => setSuccessMessage(''), 6000);
    } catch (e) {
      console.error('Failed to schedule:', e);
      setErrorMessage('Failed to save schedule.');
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
  };

  const deleteSchedule = async (id) => {
    const updated = schedules.filter(s => s.id !== id);
    await saveSchedules(updated);
    await schedulerService.cancelSchedule(id, updated);
  };

  const handleTestPlay = (sched) => {
    if (playScheduledItem) {
      playScheduledItem(sched);
      setSuccessMessage(`Now testing scheduled music: "${sched.title}"!`);
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
              AUTO-PLAY TIMERS ({schedules.length})
            </p>
          </div>
        </div>

        {!showForm && (
          <button
            onClick={openScheduleForm}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase rounded-xl max-border shadow-sm cursor-pointer active:scale-95"
          >
            <Plus size={16} className="stroke-[3]" />
            <span>NEW</span>
          </button>
        )}
      </div>

      {successMessage && (
        <div className="bg-emerald-500/15 border-2 border-emerald-500 text-emerald-800 dark:text-emerald-300 p-4 rounded-2xl flex items-center gap-3 mb-6 shadow-md">
          <Check size={22} className="stroke-[3] flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="font-black text-xs sm:text-sm uppercase tracking-wide">{successMessage}</span>
        </div>
      )}

      {showForm && (
        <div className="bg-indigo-100 dark:bg-slate-800 p-5 sm:p-6 max-border rounded-3xl max-shadow mb-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-indigo-200 dark:border-slate-700 pb-3">
            <h3 className="font-black text-xl uppercase tracking-tight text-indigo-950 dark:text-white flex items-center gap-2">
              <Clock size={20} className="text-indigo-600 dark:text-indigo-400" />
              <span>NEW SCHEDULE</span>
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
              <span>SONG</span>
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
              SELECT {type === 'song' ? 'TRACK / SONG' : 'PLAYLIST'}
            </label>
            <select
              value={targetId}
              onChange={e => {
                setTargetId(e.target.value);
                setErrorMessage('');
              }}
              className="w-full bg-white dark:bg-slate-900 text-slate-950 dark:text-white p-3.5 max-border rounded-xl outline-none font-bold text-sm uppercase cursor-pointer"
            >
              <option value="">-- CHOOSE {type.toUpperCase()} --</option>
              {type === 'song' ? (
                songs.map(s => <option key={s.id} value={s.id}>{s.title} - {s.artist}</option>)
              ) : (
                playlists.map(p => <option key={p.id} value={p.id}>{p.name} ({p.songIds?.length || 0} songs)</option>)
              )}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-amber-300 mb-1 flex items-center gap-1">
                <Calendar size={14} className="text-indigo-600 dark:text-amber-400" />
                <span>DATE</span>
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
                <span>TIME</span>
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
          <div className="flex flex-wrap gap-2 pt-1">
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
              <span>{isSaving ? 'SAVING...' : 'SAVE SCHEDULE'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-3.5 bg-slate-200 dark:bg-slate-700 text-slate-950 dark:text-white font-black text-base uppercase rounded-xl max-border cursor-pointer hover:bg-slate-300"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      {/* Schedules List */}
      <div className="space-y-3.5">
        {schedules.map(sched => (
          <div
            key={sched.id}
            className={`p-4 max-border rounded-2xl max-shadow flex items-center justify-between gap-3 ${
              sched.enabled ? 'bg-indigo-50 dark:bg-slate-800' : 'bg-slate-100 dark:bg-slate-900 opacity-75'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl max-border bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                {sched.type === 'playlist' ? <ListMusic size={20} /> : <Music size={20} />}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-black text-base uppercase truncate text-indigo-950 dark:text-indigo-50">
                  {sched.title}
                </h4>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-400 mt-0.5">
                  <span>{sched.date}</span>
                  <span>•</span>
                  <span className="font-mono text-indigo-600 dark:text-amber-400 font-black">{sched.time}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => handleTestPlay(sched)}
                className="px-2.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase rounded-lg flex items-center gap-1 cursor-pointer"
                title="Test Play Now"
              >
                <Play size={12} fill="currentColor" />
                <span>PLAY</span>
              </button>
              <button
                type="button"
                onClick={() => toggleScheduleEnabled(sched.id)}
                className={`px-2.5 py-2 rounded-lg text-[10px] font-black uppercase cursor-pointer ${
                  sched.enabled ? 'bg-indigo-600 text-white' : 'bg-amber-400 text-black'
                }`}
              >
                {sched.enabled ? 'ON' : 'OFF'}
              </button>
              <button
                type="button"
                onClick={() => deleteSchedule(sched.id)}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg cursor-pointer"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        {schedules.length === 0 && !showForm && (
          <div className="text-center py-16 px-4 bg-indigo-50/50 dark:bg-slate-800/40 max-border rounded-3xl">
            <Clock size={48} className="mx-auto text-indigo-700 dark:text-indigo-300 mb-3 stroke-[2]" />
            <p className="font-black text-2xl text-indigo-950 dark:text-white uppercase tracking-widest">
              NO SCHEDULES!
            </p>
            <p className="text-xs font-black text-indigo-700 dark:text-amber-300 uppercase mt-1">
              Set timers to play your music automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchedulePage;

/* JGFMusic v1.0.2 */
