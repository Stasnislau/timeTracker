import React, { useState, useEffect } from 'react';
import { getStoredWorkTimes, storeWorkTimes, WorkTimeEntry } from './storage';

const App: React.FC = () => {
  const [workTimes, setWorkTimes] = useState<WorkTimeEntry[]>([]);
  const [timerRunning, setTimerRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    getStoredWorkTimes().then((times) => {
      const sortedTimes = times.sort((a, b) => b.startTime - a.startTime);
      setWorkTimes(sortedTimes);
    });
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
    updatedWorkTimes.sort((a, b) => b.startTime - a.startTime);
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
      const hours = Math.floor(timestamp / 3600);
      const minutes = Math.floor((timestamp % 3600) / 60);
      return `${hours.toString().padStart(3, '0')}.${minutes
        .toString()
        .padStart(2, '0')}`;
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
    <div className="p-4 py-2 bg-white max-w-[500px] w-[500px] flex flex-col h-[300px] h-max-[500px]">
      <div className="flex flex-col justify-center border-b-black border-b">
        <h1 className="text-xl font-bold text-center">Work Time Tracker</h1>
        <div className="flex justify-between mb-2">
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
              <tr key={index} className="bg-white even:bg-gray-200">
                <td className="border px-4 py-2">
                  <input
                    type="text"
                    className="w-full bg-inherit"
                    value={formatDateTime(entry.startTime, 'date')}
                    onChange={(e) =>
                      updateEntry(index, 'startDate', e.target.value)
                    }
                  />
                </td>
                <td className="border px-2 py-2">
                  <input
                    type="text"
                    className="w-full bg-inherit"
                    value={formatDateTime(entry.startTime, 'time')}
                    onChange={(e) =>
                      updateEntry(index, 'startTime', e.target.value)
                    }
                  />
                </td>
                <td className="border px-2 py-2">
                  <input
                    type="text"
                    className="w-full bg-inherit"
                    value={formatDateTime(entry.endTime, 'time')}
                    onChange={(e) =>
                      updateEntry(index, 'endTime', e.target.value)
                    }
                  />
                </td>
                <td className="border px-2 py-2">
                  <input
                    type="text"
                    className="w-full bg-inherit"
                    value={formatDateTime(entry.duration, 'duration')}
                    onChange={(e) =>
                      updateEntry(index, 'duration', e.target.value)
                    }
                  />
                </td>
                <td className="border px-2 py-2 text-center">
                  <button
                    className="bg-inherit hover:bg-gray-100 py-1 px-2 rounded-full"
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
      <div className="flex pt-4 justify-center border-t-black border-t">
        {timerRunning ? (
          <button
            className="bg-red-500 text-white py-2 px-4 rounded-full"
            onClick={stopTimer}
          >
            Stop
          </button>
        ) : (
          <button
            className="bg-gray-500 text-white py-2 px-4 rounded-full"
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
