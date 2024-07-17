import React, { useState, useEffect } from 'react';
import { getStoredWorkTimes, storeWorkTimes, WorkTimeEntry } from './storage';

const App: React.FC = () => {
  const [workTimes, setWorkTimes] = useState<WorkTimeEntry[]>([]);
  const [timerRunning, setTimerRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    getStoredWorkTimes().then((times) => setWorkTimes(times));
    chrome.storage.local.get(['timerRunning', 'startTime'], (result) => {
      if (result.timerRunning) {
        setTimerRunning(true);
        setStartTime(result.startTime);
        updateElapsedTime(result.startTime);
      }
    });
  }, []);

  useEffect(() => {
    let timerInterval: NodeJS.Timeout | null = null;
    if (timerRunning && startTime !== null) {
      timerInterval = setInterval(() => {
        updateElapsedTime(startTime);
      }, 1000);
    }
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerRunning, startTime]);

  const updateElapsedTime = (startTime: number) => {
    const now = Date.now();
    const elapsed = Math.round((now - startTime) / 1000);
    setElapsedTime(elapsed);
  };

  const startTimer = () => {
    const startTime = Date.now();
    setTimerRunning(true);
    setStartTime(startTime);
    setElapsedTime(0);
    chrome.storage.local.set({ timerRunning: true, startTime });
    chrome.action.setIcon({
      path: {
        16: 'icons/icon16On.png',
        48: 'icons/icon48On.png',
        128: 'icons/icon128On.png',
      },
    });
  };

  const stopTimer = () => {
    if (startTime === null) return;

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    const newEntry: WorkTimeEntry = {
      startTime,
      endTime,
      duration,
    };

    const updatedWorkTimes = [...workTimes, newEntry];
    setWorkTimes(updatedWorkTimes);
    storeWorkTimes(updatedWorkTimes);
    setTimerRunning(false);
    setStartTime(null);
    setElapsedTime(0);
    chrome.storage.local.set({ timerRunning: false, startTime: null });
    chrome.action.setIcon({
      path: {
        16: 'icons/icon16.png',
        48: 'icons/icon48.png',
        128: 'icons/icon128.png',
      },
    });
  };

  const deleteEntry = (index: number) => {
    const updatedWorkTimes = workTimes.filter((_, i) => i !== index);
    setWorkTimes(updatedWorkTimes);
    storeWorkTimes(updatedWorkTimes);
  };

  const updateEntry = (index: number, field: string, value: string) => {
    const updatedWorkTimes = workTimes.map((entry, i) => {
      if (i === index) {
        const newEntry = { ...entry };
        if (field === 'startDate' || field === 'endDate') {
          const date = new Date(value);
          newEntry[field === 'startDate' ? 'startTime' : 'endTime'] =
            date.getTime();
        } else if (field === 'startTime' || field === 'endTime') {
          const [hours, minutes] = value.split(':').map(Number);
          const date = new Date(
            entry[field === 'startTime' ? 'startTime' : 'endTime']
          );
          date.setHours(hours);
          date.setMinutes(minutes);
          newEntry[field === 'startTime' ? 'startTime' : 'endTime'] =
            date.getTime();
        } else if (field === 'duration') {
          const [hours, minutes, seconds] = value.split(':').map(Number);
          const newDuration = hours * 3600 + minutes * 60 + seconds;
          const newEndTime = entry.startTime + newDuration * 1000;
          newEntry.duration = newDuration;
          newEntry.endTime = newEndTime;
        }
        return newEntry;
      }
      return entry;
    });
    setWorkTimes(updatedWorkTimes);
    storeWorkTimes(updatedWorkTimes);
  };

  const formatDateTime = (timestamp: number, format: string) => {
    const date = new Date(timestamp);
    if (format === 'date') {
      return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
    } else if (format === 'time') {
      return `${date.getHours().toString().padStart(2, '0')}:${date
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;
    } else if (format === 'duration') {
      const hours = Math.floor(timestamp / 3600);
      const minutes = Math.floor((timestamp % 3600) / 60);
      const seconds = timestamp % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else if (format === 'report') {
      const days = Math.floor(timestamp / 86400);
      const hours = Math.floor((timestamp % 86400) / 3600);
      const minutes = Math.floor((timestamp % 3600) / 60);
      return `${days.toString().padStart(2, '0')}.${hours
        .toString()
        .padStart(2, '0')}.${minutes.toString().padStart(2, '0')}`
    }
    return '';
  };

  const calculateTotalTime = (filter: (entry: WorkTimeEntry) => boolean) => {
    return workTimes
      .filter(filter)
      .reduce((acc, entry) => acc + entry.duration, 0);
  };

  const totalMonthTime = calculateTotalTime(
    (entry) => new Date(entry.startTime).getMonth() === new Date().getMonth()
  );
  const totalTodayTime = calculateTotalTime(
    (entry) =>
      new Date(entry.startTime).toDateString() === new Date().toDateString()
  );

  return (
    <div className="p-4 bg-gray-100 rounded-lg shadow-lg max-w-[500px] w-[500px] flex flex-col h-[300px] h-max-[500px]">
      <h1 className="text-2xl font-bold mb-4 text-center">Work Time Tracker</h1>
      <div className="flex justify-between mb-4">
        <span>
          Total this month: {formatDateTime(totalMonthTime, 'report')}
        </span>
        {timerRunning && (
          <span>
            Current Session:{' '}
            <span className="text-red-500 font-bold">
              {formatDateTime(elapsedTime, 'duration')}
            </span>
          </span>
        )}
        <span>Total today: {formatDateTime(totalTodayTime, 'duration')}</span>
      </div>
      <div className="overflow-auto flex-grow">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border px-4 py-2">Date</th>
              <th className="border px-4 py-2">Start Time</th>
              <th className="border px-4 py-2">End Time</th>
              <th className="border px-4 py-2">Duration</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {workTimes.map((entry, index) => (
              <tr key={index} className="bg-white even:bg-gray-50">
                <td className="border px-4 py-2">
                  <input
                    type="text"
                    className="w-full"
                    value={formatDateTime(entry.startTime, 'date')}
                    onChange={(e) =>
                      updateEntry(index, 'startDate', e.target.value)
                    }
                  />
                </td>
                <td className="border px-4 py-2">
                  <input
                    type="text"
                    className="w-full"
                    value={formatDateTime(entry.startTime, 'time')}
                    onChange={(e) =>
                      updateEntry(index, 'startTime', e.target.value)
                    }
                  />
                </td>
                <td className="border px-4 py-2">
                  <input
                    type="text"
                    className="w-full"
                    value={formatDateTime(entry.endTime, 'time')}
                    onChange={(e) =>
                      updateEntry(index, 'endTime', e.target.value)
                    }
                  />
                </td>
                <td className="border px-4 py-2">
                  <input
                    type="text"
                    className="w-full"
                    value={formatDateTime(entry.duration, 'duration')}
                    onChange={(e) =>
                      updateEntry(index, 'duration', e.target.value)
                    }
                  />
                </td>
                <td className="border px-4 py-2 text-center">
                  <button
                    className="bg-red-500 text-white py-1 px-2 rounded"
                    onClick={() => deleteEntry(index)}
                  >
                    X
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex mt-4 justify-center">
        {timerRunning ? (
          <button
            className="bg-red-500 text-white py-2 px-4 rounded"
            onClick={stopTimer}
          >
            Stop
          </button>
        ) : (
          <button
            className="bg-green-500 text-white py-2 px-4 rounded"
            onClick={startTimer}
          >
            Start
          </button>
        )}
      </div>
    </div>
  );
};

export default App;
