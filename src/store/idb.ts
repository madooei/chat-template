import { deleteDB, type IDBPDatabase, openDB } from "idb";

let dbPromise: Promise<IDBPDatabase> | null = null;

function openDatabase(): Promise<IDBPDatabase> {
  return openDB("chat-app", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("chats")) {
        db.createObjectStore("chats");
      }
      if (!db.objectStoreNames.contains("messages")) {
        db.createObjectStore("messages");
      }
    },
  });
}

export function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDatabase();
  }
  return dbPromise;
}

export async function idbGet<T>(
  storeName: string,
  key: string,
): Promise<T | undefined> {
  const db = await getDb();
  return db.get(storeName, key) as Promise<T | undefined>;
}

export async function idbPut<T>(
  storeName: string,
  key: string,
  value: T,
): Promise<void> {
  const db = await getDb();
  await db.put(storeName, value, key);
}

/**
 * Ensures the DB is open. Safe to call multiple times.
 */
export async function ensureDbReady(): Promise<void> {
  await getDb();
}

/**
 * For tests: close the DB connection, delete the database, and reset state.
 */
export async function resetDb(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise;
    db.close();
  }
  dbPromise = null;

  await deleteDB("chat-app");
}
