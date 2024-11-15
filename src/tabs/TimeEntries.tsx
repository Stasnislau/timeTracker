import React, { useState, useEffect, useMemo } from "react";
import { useWorkEntries } from "../api/hooks/useWorkEntries";
import { WorkEntry } from "../types/workEntry";
import { useCreateWorkEntry } from "../api/hooks/useCreateWorkEntry";
import { useDeleteWorkEntry } from "../api/hooks/useDeleteWorkEntry";
import { useProjectStore } from "../store/projectStore";
import { Project } from "../types/project";
import { formatDateTime } from "../utils/formatDateTime";
import { useProjects } from "../api/hooks/useProjects";
import { useUpdateWorkEntry } from "../api/hooks/useUpdateWorkEntry";

interface WorkEntryWithDuration extends WorkEntry {
  duration: number;
  project?: Project;
}

interface EditableEntry {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
}

// Добавить новые функции для валидации формата
const isValidTimeFormat = (time: string): boolean => {
  return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
};

const isValidDateFormat = (date: string): boolean => {
  return /^([0-2][0-9]|3[0-1])\.(0[1-9]|1[0-2])\.\d{4}$/.test(date);
};

const TimerEntries: React.FC = () => {
  const { workEntries } = useWorkEntries();
  const { projects } = useProjects();
  const [showCurrentProjectOnly, setShowCurrentProjectOnly] = useState(false);

  const [timerRunning, setTimerRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const { createWorkEntry } = useCreateWorkEntry();
  const { deleteWorkEntry } = useDeleteWorkEntry();
  const { currentProject } = useProjectStore();

  const [editingEntry, setEditingEntry] = useState<EditableEntry | null>(null);
  const { updateWorkEntry } = useUpdateWorkEntry();

  const workTimes = useMemo(() => {
    const workTimes: WorkEntryWithDuration[] = [];
    workEntries?.forEach((entry) => {
      if (showCurrentProjectOnly && entry.projectId !== currentProject?.id) {
        return;
      }
      workTimes.push({
        ...entry,
        duration:
          new Date(entry.endTime).getTime() -
          new Date(entry.startTime).getTime(),
      });
    });
    return workTimes.sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  }, [workEntries, showCurrentProjectOnly, currentProject?.id]);

  useEffect(() => {
    chrome.storage.local.get(["timerRunning", "startTime"], (result) => {
      if (result.timerRunning) {
        setTimerRunning(true);
        const savedStartTime = new Date(result.startTime);
        setStartTime(savedStartTime);
        updateElapsedTime(savedStartTime);
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

  const updateElapsedTime = (startTime: Date) => {
    const now = new Date();
    const elapsed = now.getTime() - new Date(startTime).getTime();
    setElapsedTime(elapsed);
  };

  const startTimer = () => {
    const startTime = new Date();
    setTimerRunning(true);
    setStartTime(startTime);
    setElapsedTime(0);
    chrome.storage.local.set({
      timerRunning: true,
      startTime: startTime.toISOString(),
    });
    chrome.action.setIcon({
      path: {
        16: "icons/icon16On.png",
        48: "icons/icon48On.png",
        128: "icons/icon128On.png",
      },
    });
  };

  const stopTimer = () => {
    if (startTime === null) return;

    const endTime = new Date();
    createWorkEntry({
      projectId: currentProject?.id || "",
      startTime,
      endTime,
    });

    setTimerRunning(false);
    setStartTime(null);
    setElapsedTime(0);
    chrome.storage.local.set({
      timerRunning: false,
      startTime: null,
    });
    chrome.action.setIcon({
      path: {
        16: "icons/icon16.png",
        48: "icons/icon48.png",
        128: "icons/icon128.png",
      },
    });
  };

  const calculateTotalTime = (filter: (entry: WorkEntry) => boolean) => {
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

  const handleEdit = (entry: WorkEntryWithDuration) => {
    const date = formatDateTime(new Date(entry.startTime).getTime(), "date");
    const startTime = formatDateTime(
      new Date(entry.startTime).getTime(),
      "time"
    );
    const endTime = formatDateTime(new Date(entry.endTime).getTime(), "time");

    setEditingEntry({
      id: entry.id,
      date,
      startTime,
      endTime,
    });
  };

  const handleSave = async (entry: EditableEntry) => {
    if (
      !isValidDateFormat(entry.date) ||
      !isValidTimeFormat(entry.startTime) ||
      !isValidTimeFormat(entry.endTime)
    ) {
      return;
    }

    const [day, month, year] = entry.date.split(".");
    const startDateTime = new Date(
      `${year}-${month}-${day}T${entry.startTime}:00`
    );
    const endDateTime = new Date(`${year}-${month}-${day}T${entry.endTime}:00`);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      return;
    }

    if (
      endDateTime <= startDateTime ||
      startDateTime > new Date() ||
      endDateTime > new Date()
    ) {
      return;
    }

    updateWorkEntry({
      id: entry.id,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      projectId: workEntries?.find((e) => e.id === entry.id)?.projectId || "",
    });

    setEditingEntry(null);
  };

  const handleCancel = () => {
    setEditingEntry(null);
  };

  return (
    <div className="flex flex-col flex-grow overflow-hidden">
      <div className="flex flex-col justify-center border-b-black border-b">
        <div className="flex justify-between mb-2">
          <span>
            Total this month: {formatDateTime(totalMonthTime, "report")}
          </span>
          {timerRunning && (
            <span>
              Current Session:{" "}
              <span className="text-teal-500 font-bold">
                {formatDateTime(elapsedTime, "duration")}
              </span>
            </span>
          )}
          <span>Total today: {formatDateTime(totalTodayTime, "duration")}</span>
        </div>
      </div>
      <div className="overflow-y-auto flex-grow h-full">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border px-4 py-2">Date</th>
              <th className="border px-4 py-2">Start</th>
              <th className="border px-4 py-2">End</th>
              <th className="border px-4 py-2">Duration</th>
              <th className="border px-4 py-2">Project</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {workTimes.map((entry, index) => (
              <tr key={index} className="bg-white even:bg-gray-200">
                <td className="border px-4 py-2 text-center">
                  {editingEntry?.id === entry.id ? (
                    <input
                      type="text"
                      value={editingEntry.date}
                      onChange={(e) => {
                        setEditingEntry({
                          ...editingEntry,
                          date: e.target.value,
                        });
                      }}
                      placeholder="DD.MM.YYYY"
                      className="w-full text-xs border-none rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  ) : (
                    formatDateTime(new Date(entry.startTime).getTime(), "date")
                  )}
                </td>
                <td className="border px-2 py-2 text-center">
                  {editingEntry?.id === entry.id ? (
                    <input
                      type="text"
                      value={editingEntry.startTime}
                      onChange={(e) => {
                        setEditingEntry({
                          ...editingEntry,
                          startTime: e.target.value,
                        });
                      }}
                      placeholder="HH:MM"
                      className="w-full text-xs border-none rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  ) : (
                    formatDateTime(new Date(entry.startTime).getTime(), "time")
                  )}
                </td>
                <td className="border px-2 py-2 text-center">
                  {editingEntry?.id === entry.id ? (
                    <input
                      type="text"
                      value={editingEntry.endTime}
                      onChange={(e) => {
                        setEditingEntry({
                          ...editingEntry,
                          endTime: e.target.value,
                        });
                      }}
                      placeholder="HH:MM"
                      className="w-full text-xs border-none rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  ) : (
                    formatDateTime(new Date(entry.endTime).getTime(), "time")
                  )}
                </td>
                <td className="border px-2 py-2 text-center">
                  {formatDateTime(entry.duration, "duration")}
                </td>
                <td className="border px-4 py-2 text-center">
                  {projects?.find((p) => p.id === entry.projectId)?.name ||
                    "Unknown Project"}
                </td>
                <td className="border px-2 py-2 text-center">
                  <div className="flex justify-center gap-2">
                    {editingEntry?.id === entry.id ? (
                      <>
                        <button
                          className="bg-inherit hover:bg-gray-100 rounded-full"
                          onClick={() => handleSave(editingEntry)}
                        >
                          <img
                            src="icons/check.svg"
                            alt="Save"
                            className="h-4 w-4 hover:scale-110"
                          />
                        </button>
                        <button
                          className="bg-inherit hover:bg-gray-100 rounded-full"
                          onClick={handleCancel}
                        >
                          <img
                            src="icons/cancel.svg"
                            alt="Cancel"
                            className="h-4 w-4 hover:scale-110"
                          />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="bg-inherit hover:bg-gray-100 rounded-full"
                          onClick={() => handleEdit(entry)}
                        >
                          <img
                            src="icons/edit.svg"
                            alt="Edit"
                            className="h-4 w-4 hover:scale-110"
                          />
                        </button>
                        <button
                          className="bg-inherit hover:bg-gray-100 rounded-full"
                          onClick={() => deleteWorkEntry(entry.id)}
                        >
                          <img
                            src="icons/delete.svg"
                            alt="Delete"
                            className="h-4 w-4 hover:scale-110"
                          />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex pt-2 justify-between items-center border-t-black border-t">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={showCurrentProjectOnly}
            onChange={(e) => setShowCurrentProjectOnly(e.target.checked)}
            className="mr-2"
          />
          Show current project only
        </label>

        {timerRunning ? (
          <button
            className="bg-red-500 text-white py-2 px-4 rounded-full"
            onClick={stopTimer}
          >
            Stop
          </button>
        ) : (
          <button
            className="bg-teal-500 text-white py-2 px-4 rounded-full"
            onClick={startTimer}
          >
            Start
          </button>
        )}

        <span className="text-gray-700">
          Current project: {currentProject?.name || "No project selected"}
        </span>
      </div>
    </div>
  );
};

export default TimerEntries;
