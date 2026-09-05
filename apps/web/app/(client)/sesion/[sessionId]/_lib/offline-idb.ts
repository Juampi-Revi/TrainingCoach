const DB_NAME = "regen-offline";
const DB_VERSION = 1;
const STORE = "set-queue";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export interface OfflineSetItem {
  id?: number;
  sessionId: string;
  wseId: string;
  setNumber: number;
  body: Record<string, string>;
}

export async function enqueueOfflineSet(item: Omit<OfflineSetItem, "id">): Promise<number> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).add(item);
    req.onsuccess = () => resolve(Number(req.result));
    req.onerror = () => reject(req.error);
  });
}

export async function listOfflineSets(sessionId: string): Promise<OfflineSetItem[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => {
      const all = (req.result as OfflineSetItem[]) ?? [];
      resolve(all.filter((i) => i.sessionId === sessionId));
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteOfflineSet(id: number): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function countOfflineSets(sessionId: string): Promise<number> {
  const items = await listOfflineSets(sessionId);
  return items.length;
}

export async function clearOfflineSets(sessionId: string): Promise<void> {
  const items = await listOfflineSets(sessionId);
  await Promise.all(items.filter((i) => i.id != null).map((i) => deleteOfflineSet(i.id as number)));
}

/** One-time migrate from the old localStorage queue. */
export async function migrateLegacyQueue(sessionId: string, queueKey: string): Promise<void> {
  try {
    const raw = localStorage.getItem(queueKey);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Array<{ wseId: string; setNumber: number; body: Record<string, string> }>;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.removeItem(queueKey);
      return;
    }
    for (const item of parsed) {
      await enqueueOfflineSet({ sessionId, wseId: item.wseId, setNumber: item.setNumber, body: item.body });
    }
    localStorage.removeItem(queueKey);
  } catch {
    /* ignore */
  }
}
