// import { WorkEntry } from "./types/workEntry";
// import { storeWorkEntries } from "./db/db";
// import { seedData } from "./seedData";

// chrome.runtime.onInstalled.addListener(async () => {
//   chrome.storage.local.set({ workEntries: [] as WorkEntry[] });

//   const parseDuration = (duration: string) => {
//     const [hours, minutes, seconds] = duration.split(':').map(Number);
//     return (hours * 3600 + minutes * 60 + seconds);
//   };

//   const workEntries: WorkEntry[] = seedData.map((entry) => {
//     const [day, month, year] = entry.date.split(".").map(String);

//     const recordedDate = `${year}-${month}-${day}`;
//     return {
//       startTime: new Date(`${recordedDate}T${entry.startTime}:00`).getTime(),
//       endTime: new Date(`${recordedDate}T${entry.endTime}:00`).getTime(),
//       duration: parseDuration(entry.duration),
//     };
//   });

//   await storeWorkEntries(workEntries);
// });
