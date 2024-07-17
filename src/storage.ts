export interface WorkTimeEntry {
  startTime: number;
  endTime: number;
  duration: number;
}

export const getStoredWorkTimes = (): Promise<WorkTimeEntry[]> => {
  return new Promise((resolve) => {
    chrome.storage.local.get(['workTimes'], (result) => {
      resolve(result.workTimes || []);
    });
  });
};

export const storeWorkTimes = (workTimes: WorkTimeEntry[]) => {
  chrome.storage.local.set({ workTimes });
};
