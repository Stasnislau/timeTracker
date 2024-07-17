import { WorkTimeEntry } from './storage';

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ workTimes: [] as WorkTimeEntry[] });
});