import React, { useState, useEffect, useMemo, useRef } from "react";
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
  description: string;
  projectId: string;
}

const isValidTimeFormat = (time: string): boolean => {
  return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
};

const isValidDateFormat = (date: string): boolean => {
  return /^([0-2][0-9]|3[0-1])\.(0[1-9]|1[0-2])\.\d{4}$/.test(date);
};

const TimerEntries: React.FC = () => {
  const {
    workEntries,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useWorkEntries();
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

  const [description, setDescription] = useState<string>("");
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);

  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      !isLoading &&
      workEntries?.length === 0 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    isLoading,
    workEntries,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  ]);

  useEffect(() => {
    if (!hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [fetchNextPage, hasNextPage]);

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
        project: projects?.find((p) => p.id === entry.projectId),
      });
    });
    return workTimes.sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  }, [workEntries, showCurrentProjectOnly, currentProject?.id, projects]);

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
    setShowDescriptionModal(true);
  };

  const finalizeTimer = () => {
    if (startTime === null) return;
    const endTime = new Date();

    createWorkEntry({
      projectId: currentProject?.id || "",
      startTime,
      endTime,
      description: description.trim() || "No description",
    });

    setTimerRunning(false);
    setStartTime(null);
    setElapsedTime(0);
    setDescription("");
    setShowDescriptionModal(false);

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
      description: entry.description || "",
      projectId: entry.projectId || "",
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
      projectId: entry.projectId,
      description: entry.description,
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
      <div className="overflow-y-auto flex-grow w-full max-w-full overflow-x-auto">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border px-2 py-2">Date</th>
              <th className="border px-2 py-2">Start</th>
              <th className="border px-2 py-2">End</th>
              <th className="border px-2 py-2">Duration</th>
              <th className="border px-2 py-2">Project</th>
              <th className="border px-2 py-2">Description</th>
              <th className="border px-2 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {workTimes.map((entry, index) => (
              <tr key={index} className={`bg-white even:bg-gray-200 `}>
                <td className="border px-2 py-2 text-center text-ellipsis whitespace-nowrap overflow-hidden">
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
                    <span
                      title={formatDateTime(
                        new Date(entry.startTime).getTime(),
                        "date"
                      )}
                    >
                      {formatDateTime(
                        new Date(entry.startTime).getTime(),
                        "date"
                      )}
                    </span>
                  )}
                </td>
                <td className="border px-2 py-2 text-center text-ellipsis whitespace-nowrap">
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
                    <span
                      title={formatDateTime(
                        new Date(entry.startTime).getTime(),
                        "time"
                      )}
                    >
                      {formatDateTime(
                        new Date(entry.startTime).getTime(),
                        "time"
                      )}
                    </span>
                  )}
                </td>
                <td className="border px-2 py-2 text-center text-ellipsis whitespace-nowrap">
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
                    <span
                      title={formatDateTime(
                        new Date(entry.endTime).getTime(),
                        "time"
                      )}
                    >
                      {formatDateTime(
                        new Date(entry.endTime).getTime(),
                        "time"
                      )}
                    </span>
                  )}
                </td>
                <td className="border px-2 py-2 text-center">
                  <span title={formatDateTime(entry.duration, "duration")}>
                    {formatDateTime(entry.duration, "duration")}
                  </span>
                </td>
                <td className="border px-2 py-2 text-xs text-center text-ellipsis whitespace-nowrap overflow-hidden">
                  {editingEntry?.id === entry.id ? (
                    <select
                      value={editingEntry.projectId}
                      onChange={(e) => {
                        if (editingEntry) {
                          setEditingEntry({
                            ...editingEntry,
                            projectId: e.target.value,
                          });
                        }
                      }}
                      className="w-full text-sm border-none rounded focus:outline-none focus:ring-1 focus:ring-teal-500 bg-transparent"
                    >
                      {projects?.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      title={entry.project?.name || "Unknown Project"}
                    >
                      {entry.project?.name || "Unknown Project"}
                    </span>
                  )}
                </td>
                <td className="border px-2 py-2 text-ellipsis whitespace-nowrap overflow-hidden max-w-[100px]">
                  {editingEntry?.id === entry.id ? (
                    <input
                      type="text"
                      value={editingEntry.description}
                      onChange={(e) => {
                        setEditingEntry({
                          ...editingEntry,
                          description: e.target.value,
                        });
                      }}
                      className="w-full text-sm border-none rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  ) : (
                    <span 
                      className="text-sm text-gray-600 block truncate"
                      title={entry.description || "No description"}
                    >
                      {entry.description || "No description"}
                    </span>
                  )}
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

        <div
          ref={loadMoreRef}
          className="w-full py-4 text-center text-gray-500"
        >
          {isFetchingNextPage ? (
            <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          ) : hasNextPage ? (
            "Loading more entries..."
          ) : (
            "No more entries"
          )}
        </div>
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

      {showDescriptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              Add Time Entry Description
            </h3>
            <textarea
              className="w-full p-2 border rounded-md mb-4"
              rows={3}
              placeholder="What did you work on? (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                onClick={() => {
                  setDescription("");
                  setShowDescriptionModal(false);
                }}
              >
                Cancel
              </button>
              <button
                className="flex items-center px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
                onClick={() => finalizeTimer()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimerEntries;
