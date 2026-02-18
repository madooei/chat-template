import { observable, type Observable } from "@legendapp/state";
import { toast } from "sonner";
import { ensureDbReady, idbGet, idbPut } from "@/store/idb";

/**
 * Creates an observable backed by IndexedDB.
 *
 * The observable is created synchronously with a default value so it can be
 * used at module scope. The returned `hydrated` promise resolves once the
 * real data has been loaded from IndexedDB (after migration, if needed).
 */
export function createPersistedIdbObservable<T>(
  storeName: string,
  key: string,
  initial: T,
  decode: (value: unknown) => T,
): { obs: Observable<T>; hydrated: Promise<void> } {
  const obs = observable<T>(initial);

  const hydrated = (async () => {
    await ensureDbReady();

    try {
      const stored = await idbGet<unknown>(storeName, key);
      if (stored !== undefined) {
        (obs.set as (value: T) => void)(decode(stored));
      }
    } catch {
      // Fallback to initial value for malformed IndexedDB entries.
    }
  })();

  obs.onChange(({ value }) => {
    idbPut(storeName, key, value).catch(() => {
      toast.error("Unable to save data", {
        description: "Storage is unavailable. Your changes may not persist.",
      });
    });
  });

  return { obs, hydrated };
}
