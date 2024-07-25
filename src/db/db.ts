export interface WorkTimeEntry {
    startTime: number;
    endTime: number;
    duration: number;
  }
  
  const DB_NAME = "WorkTimeDB";
  const DB_VERSION = 1;
  const STORE_NAME = "workTimes";
  
  const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
  
      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
      };
  
      request.onsuccess = (event: Event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };
  
      request.onerror = (event: Event) => {
        reject(`IndexedDB error: ${(event.target as IDBOpenDBRequest).error}`);
      };
    });
  };
  
  export const getTransaction = async (storeName: string, mode: IDBTransactionMode) => {
    const db = await openDB();
    return db.transaction(storeName, mode).objectStore(storeName);
  };
  
  export const getStoredWorkTimes = async (): Promise<WorkTimeEntry[]> => {
    const store = await getTransaction(STORE_NAME, 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
  
      request.onsuccess = (event: Event) => {
        resolve((event.target as IDBRequest<WorkTimeEntry[]>).result);
      };
  
      request.onerror = (event: Event) => {
        reject(`IndexedDB error: ${(event.target as IDBRequest).error}`);
      };
    });
  };
  
  export const storeWorkTimes = async (workTimes: WorkTimeEntry[]) => {
    const store = await getTransaction(STORE_NAME, 'readwrite');
    return new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => {
        workTimes.forEach((entry) => store.add(entry));
        resolve();
      };
  
      request.onerror = (event: Event) => {
        reject(`IndexedDB error: ${(event.target as IDBRequest).error}`);
      };
    });
  };